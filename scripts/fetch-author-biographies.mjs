// Fetches lead-section biographies from Wikipedia for every author in the
// catalog and caches them locally. `generate-editorial-notes.mjs` reads the
// cache; this script is the only part that touches the network.
//
// Resolution path, mirroring how the quotes were imported:
//   Wikiquote pageid -> Wikidata QID -> Wikipedia sitelink -> lead extract
// English authors imported from curated sets carry no Wikiquote pageid, so
// their display name is used as the Wikipedia title directly.
//
// Output: data/author-biographies.json (untracked, like the quote catalogs —
// re-run this script to rebuild it).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contextsPath = path.join(root, "QUOTE_CONTEXTS.json");
const outputPath = path.join(root, "data/author-biographies.json");

const USER_AGENT =
  "ECHO-Quote-App/1.0 (author biography import; contact: abc510433622@gmail.com)";
const REQUEST_DELAY_MS = 320;

const WIKI_HOSTS = {
  en: { quote: "en.wikiquote.org", pedia: "en.wikipedia.org", site: "enwiki" },
  ja: { quote: "ja.wikiquote.org", pedia: "ja.wikipedia.org", site: "jawiki" },
  "zh-Hans": {
    quote: "zh.wikiquote.org",
    pedia: "zh.wikipedia.org",
    site: "zhwiki",
  },
};

let previousRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(host, params) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const waitFor = REQUEST_DELAY_MS - (Date.now() - previousRequestAt);
    if (waitFor > 0) await sleep(waitFor);

    const url = new URL(`https://${host}/w/api.php`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    previousRequestAt = Date.now();
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      const body = await response.text();
      if (response.ok && body.trimStart().startsWith("{")) {
        const parsed = JSON.parse(body);
        if (!parsed.error) return parsed;
      }
    } catch {
      // retried below
    }
    await sleep(900 * (attempt + 1));
  }
  throw new Error(`Request to ${host} failed after retries.`);
}

function chunk(items, size) {
  const batches = [];
  for (let offset = 0; offset < items.length; offset += size) {
    batches.push(items.slice(offset, offset + size));
  }
  return batches;
}

// Wikiquote pageid -> Wikidata QID.
async function resolveQids(host, pageIds) {
  const byPageId = new Map();
  for (const batch of chunk(pageIds, 50)) {
    const response = await getJson(host, {
      action: "query",
      pageids: batch.join("|"),
      prop: "pageprops",
      ppprop: "wikibase_item",
      format: "json",
      formatversion: 2,
    });
    for (const page of response.query?.pages ?? []) {
      const qid = page.pageprops?.wikibase_item;
      if (qid) byPageId.set(String(page.pageid), qid);
    }
  }
  return byPageId;
}

// Wikidata QID -> Wikipedia article title for the matching language edition.
async function resolveTitles(qids, site) {
  const byQid = new Map();
  for (const batch of chunk(qids, 50)) {
    const response = await getJson("www.wikidata.org", {
      action: "wbgetentities",
      ids: batch.join("|"),
      props: "sitelinks",
      sitefilter: site,
      format: "json",
      formatversion: 2,
    });
    for (const [qid, entity] of Object.entries(response.entities ?? {})) {
      const title = entity.sitelinks?.[site]?.title;
      if (title) byQid.set(qid, title);
    }
  }
  return byQid;
}

// Wikipedia title -> plain-text lead section.
async function resolveExtracts(host, titles, language) {
  const byTitle = new Map();
  for (const batch of chunk(titles, 20)) {
    const params = {
      action: "query",
      titles: batch.join("|"),
      prop: "extracts",
      exintro: 1,
      explaintext: 1,
      redirects: 1,
      format: "json",
      formatversion: 2,
    };
    // Serve Simplified Chinese rather than whatever variant the article uses.
    if (language === "zh-Hans") params.variant = "zh-hans";

    const response = await getJson(host, params);
    const normalized = new Map(
      (response.query?.normalized ?? []).map((entry) => [entry.to, entry.from]),
    );
    const redirected = new Map(
      (response.query?.redirects ?? []).map((entry) => [entry.to, entry.from]),
    );

    for (const page of response.query?.pages ?? []) {
      if (page.missing || !page.extract?.trim()) continue;
      // Map back through redirect/normalization so the caller can look the
      // result up by the title it asked for.
      let title = page.title;
      for (const table of [redirected, normalized]) {
        if (table.has(title)) title = table.get(title);
      }
      byTitle.set(title, page.extract.trim());
      byTitle.set(page.title, page.extract.trim());
    }
  }
  return byTitle;
}

const contextDocument = JSON.parse(fs.readFileSync(contextsPath, "utf8"));
const authorsByLanguage = new Map();
for (const author of contextDocument.authors) {
  if (!authorsByLanguage.has(author.language)) {
    authorsByLanguage.set(author.language, []);
  }
  authorsByLanguage.get(author.language).push(author);
}

const biographies = {};
let resolved = 0;
let missing = 0;

for (const [language, authors] of authorsByLanguage) {
  const hosts = WIKI_HOSTS[language];
  if (!hosts) throw new Error(`Unknown language ${language}`);

  const withPageId = [];
  const withoutPageId = [];
  for (const author of authors) {
    const match = author.author_id.match(/^(?:en|ja|zh)_wikiquote_(\d+)/);
    if (match) withPageId.push({ author, pageId: match[1] });
    else withoutPageId.push(author);
  }

  process.stdout.write(
    `${language}: ${withPageId.length} via pageid, ${withoutPageId.length} via display name … `,
  );

  const qidByPageId = await resolveQids(
    hosts.quote,
    withPageId.map((entry) => entry.pageId),
  );
  const titleByQid = await resolveTitles(
    [...new Set(qidByPageId.values())],
    hosts.site,
  );

  const wanted = new Map();
  for (const { author, pageId } of withPageId) {
    const title = titleByQid.get(qidByPageId.get(pageId));
    if (title) wanted.set(author.author_ref, title);
  }
  for (const author of withoutPageId) {
    wanted.set(author.author_ref, author.display_name);
  }

  const extracts = await resolveExtracts(
    hosts.pedia,
    [...new Set(wanted.values())],
    language,
  );

  let found = 0;
  for (const [authorRef, title] of wanted) {
    const extract = extracts.get(title);
    if (!extract) {
      missing += 1;
      continue;
    }
    biographies[authorRef] = { title, extract };
    found += 1;
    resolved += 1;
  }
  console.log(`resolved ${found}/${authors.length}`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      source: "Wikipedia lead sections, retrieved via the MediaWiki API",
      license: "CC BY-SA 4.0",
      retrieved_at: new Date().toISOString().slice(0, 10),
      biographies,
    },
    null,
    2,
  )}\n`,
);

console.log(
  `\nResolved ${resolved} biographies, ${missing} unresolved. Wrote ${path.relative(root, outputPath)}.`,
);
