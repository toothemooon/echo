# Quote Context Research Ledger

This ledger records browser-based verification work for `QUOTE_CONTEXTS.json`.
It is not a substitute for the source objects stored on each author or quote
record.

## Decision rules

1. Generate an exact-phrase query from the quote’s most distinctive wording,
   combined with the attributed author and any known work.
2. Prefer primary texts, official archives, collected papers, speech
   transcripts, Google Books bibliographic records, and scholarly editions.
3. Use Wikiquote and quotation databases only to discover candidate sources.
4. Do not treat search-result or AI-generated summaries as evidence.
5. Assign:
   - `verified` only when a primary location is identified;
   - `needs_context` when the primary location is known but the immediate
     occasion is not;
   - `unverified` when only secondary circulation can be found;
   - `disputed` when reliable research rejects or conflicts with the catalog
     attribution.

## Progress

Initial catalog state:

- 1,253 author records with no verified biographies.
- 5,999 pending quote contexts and one verified composite context.

Browser research completed in the first evidence-graded batch:

| Record | Result | Principal evidence |
| --- | --- | --- |
| A.A. Milne biography | verified | Encyclopaedia Britannica |
| Abigail Adams biography | verified | Encyclopaedia Britannica |
| Aesop biography | verified with historical uncertainty | Encyclopaedia Britannica |
| Albert Einstein biography | verified | Encyclopaedia Britannica |
| Quote 156, Piglet / gratitude | unverified | Scholastic secondary attribution; no primary location found |
| Quote 18, difficulty / opportunity | disputed | Quote Investigator; wording traced to John Archibald Wheeler |
| Quote 76, look deep into nature | unverified | Today in Science History explicitly reports no primary source |

The next research pass should resume with quote 140 (Abigail Adams) and quote
151 (Aesop), followed by the remaining English `attribution_only` records.

## 2026-08-11 — regeneration data loss

`QUOTE_CONTEXTS.json` is untracked, so a regeneration that dropped every
Chinese and Japanese `quote_contexts` entry (4,283 → 1,465, English only) could
not be rolled back. The 1,214 author records were unaffected.

The missing 2,818 entries were rebuilt by `scripts/generate-editorial-notes.mjs`
from the published catalog. What could **not** be restored, because it was
hand-verified rather than derived:

- `ja-wikiquote-451-02` (Koizumi) — was `verified_composite`, now `pending`.
- The four `verified` biographies above retain their text but lost their
  `biography_sources`; all author records now carry `editorial_profile`.

Re-verification of these records should be prioritised in the next pass. The 29
English contexts whose `text_fingerprint` no longer matched the quote text were
traced to an ASCII "..." → "…" normalisation applied after the fingerprints were
taken; fingerprints are now recomputed on every run and asserted in the tests.

## Historical echo is not context verification

The profile screen now shows a "historical echo" section built from Wikidata
claims and Wikipedia leads. It describes **the world a speaker lived in** — era,
birthplace, calling, intellectual current, and what the source work is.

It is **not** a substitute for the research recorded in this ledger. The
occasion of a quotation — when, where, to whom, in response to what — remains
unverified for all 4,283 records, and the echo never asserts one. A regex in
`tests/quoteContexts.test.ts` fails the build if any echo text starts claiming
one.

Note that the per-context `verification_status` field has since been removed:
it read `pending` for every record, and the three fields that only restated it
(`context_type`, `context_content_status`, `context_summary`) went with it. When
this ledger's research does establish an occasion for a record, reintroduce the
field at that point — with real values rather than a single constant — and
render the verified occasion from it. Per-record provenance for the quotation
itself is still kept in `context_sources`.

