#!/usr/bin/env python3
"""Find Goodreads work titles for quotes that have no source field.

The script is intentionally read-only with respect to assets/quotes.json. It
stores resumable audit results in a temporary JSON cache. Confirmed results can
then be reviewed and applied with a separate patch.
"""

from __future__ import annotations

import argparse
import html
import json
import random
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
QUOTES_PATH = ROOT / "assets" / "quotes.json"
DEFAULT_CACHE = Path("/tmp/echo-goodreads-source-cache.json")
SEARCH_URL = "https://www.goodreads.com/quotes/search"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0 Safari/537.36"
)


def normalize(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", html.unescape(value)).casefold()
    return "".join(character for character in normalized if character.isalnum())


def clean_html_text(value: str) -> str:
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    return " ".join(html.unescape(value).split())


def load_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_cache(path: Path, cache: dict[str, Any]) -> None:
    temporary_path = path.with_suffix(path.suffix + ".tmp")
    with temporary_path.open("w", encoding="utf-8") as file:
        json.dump(cache, file, ensure_ascii=False, indent=2)
        file.write("\n")
    temporary_path.replace(path)


def extract_candidates(page: str) -> list[dict[str, str | None]]:
    blocks = re.findall(
        r'<div class="quoteText">(.*?)</div>\s*<div class="quoteFooter">',
        page,
        flags=re.DOTALL,
    )
    candidates: list[dict[str, str | None]] = []

    for block in blocks:
        author_match = re.search(
            r'<span class="authorOrTitle">\s*(.*?)\s*</span>',
            block,
            flags=re.DOTALL,
        )
        source_match = re.search(
            r'<span id=quote_book_link_[^>]+>\s*'
            r'<a class="authorOrTitle"[^>]*>(.*?)</a>\s*</span>',
            block,
            flags=re.DOTALL,
        )
        quote_part = re.split(r"&#8213;|―", block, maxsplit=1)[0]
        candidates.append(
            {
                "text": clean_html_text(quote_part).strip("“”\" "),
                "author": clean_html_text(author_match.group(1)).rstrip(",")
                if author_match
                else "",
                "source": clean_html_text(source_match.group(1))
                if source_match
                else None,
            }
        )

    return candidates


def fetch_page(query: str, timeout: float) -> tuple[str, str]:
    url = f"{SEARCH_URL}?{urllib.parse.urlencode({'q': query})}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", "replace"), url


def audit_quote(quote: dict[str, Any], timeout: float) -> dict[str, Any]:
    text = quote["text"]
    author = quote["author"]
    # A substantial excerpt is enough for Goodreads search and avoids overly
    # long URLs for poem-like records.
    excerpt = " ".join(text.split())[:220]
    target_text = normalize(text)
    target_author = normalize(author)
    search_urls: list[str] = []
    exact_matches: list[dict[str, str | None]] = []

    queries = [f"{excerpt} {author}"]
    short_excerpt = " ".join(text.split())[:100]
    if short_excerpt != excerpt:
        queries.append(f"{short_excerpt} {author}")

    for query in queries:
        page, url = fetch_page(query, timeout)
        search_urls.append(url)
        candidates = extract_candidates(page)
        exact_matches = [
            candidate
            for candidate in candidates
            if normalize(candidate["text"] or "") == target_text
            and normalize(candidate["author"] or "") == target_author
        ]

        if not exact_matches:
            # Spacing corruption in the source data can make the visible
            # strings differ while their alphanumeric sequence is identical.
            exact_matches = [
                candidate
                for candidate in candidates
                if target_text
                and (
                    target_text in normalize(candidate["text"] or "")
                    or normalize(candidate["text"] or "") in target_text
                )
                and normalize(candidate["author"] or "") == target_author
            ]

        if exact_matches:
            break

    sources = sorted(
        {
            candidate["source"]
            for candidate in exact_matches
            if candidate.get("source")
        }
    )

    if len(sources) == 1:
        status = "confirmed"
        source = sources[0]
    elif len(sources) > 1:
        status = "ambiguous"
        source = None
    elif exact_matches:
        status = "matched_without_work"
        source = None
    else:
        status = "not_found"
        source = None

    return {
        "id": quote["id"],
        "author": author,
        "text": text,
        "status": status,
        "source": source,
        "candidate_sources": sources,
        "search_urls": search_urls,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--delay", type=float, default=0.35)
    parser.add_argument("--timeout", type=float, default=25.0)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--retry-errors", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    quotes = load_json(QUOTES_PATH, [])
    cache: dict[str, Any] = load_json(args.cache, {})
    pending = [quote for quote in quotes if not quote.get("source")]

    if args.retry_errors:
        pending = [
            quote
            for quote in pending
            if str(quote["id"]) not in cache
            or cache[str(quote["id"])].get("status") == "error"
        ]
    else:
        pending = [quote for quote in pending if str(quote["id"]) not in cache]

    if args.limit is not None:
        pending = pending[: args.limit]

    print(
        f"Auditing {len(pending)} quote(s); "
        f"{len(cache)} cached result(s).",
        flush=True,
    )

    def run_one(quote: dict[str, Any]) -> dict[str, Any]:
        time.sleep(random.uniform(0, args.delay))
        try:
            return audit_quote(quote, args.timeout)
        except (urllib.error.URLError, TimeoutError, ValueError) as error:
            return {
                "id": quote["id"],
                "author": quote["author"],
                "text": quote["text"],
                "status": "error",
                "source": None,
                "error": f"{type(error).__name__}: {error}",
                "checked_at": datetime.now(timezone.utc).isoformat(),
            }

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        futures = {executor.submit(run_one, quote): quote for quote in pending}

        for index, future in enumerate(as_completed(futures), start=1):
            quote = futures[future]
            result = future.result()
            cache[str(quote["id"])] = result
            save_cache(args.cache, cache)

            if index == 1 or index % 25 == 0 or index == len(pending):
                counts: dict[str, int] = {}
                for cached_result in cache.values():
                    status = cached_result.get("status", "unknown")
                    counts[status] = counts.get(status, 0) + 1
                print(
                    f"Progress {index}/{len(pending)}; statuses={counts}",
                    flush=True,
                )

    return 0


if __name__ == "__main__":
    sys.exit(main())
