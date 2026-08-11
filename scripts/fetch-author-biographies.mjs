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
import { cleanWorkTitle } from "./wikiquote-support.mjs";

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

// "|" is the API's own separator for batched titles and the rest are illegal in
// MediaWiki titles, so a single such name corrupts the whole batch.
function isFetchableTitle(title) {
  return Boolean(title) && !/[|#<>[\]{}]/.test(title);
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

// Authors imported from curated sets have no Wikiquote pageid, so their QID is
// read off the Wikipedia article that the display name resolved to.
async function resolveQidsByTitle(host, titles) {
  const byTitle = new Map();
  for (const batch of chunk(titles.filter(isFetchableTitle), 50)) {
    const response = await getJson(host, {
      action: "query",
      titles: batch.join("|"),
      prop: "pageprops",
      ppprop: "wikibase_item",
      redirects: 1,
      format: "json",
      formatversion: 2,
    });
    const normalized = new Map(
      (response.query?.normalized ?? []).map((entry) => [entry.to, entry.from]),
    );
    const redirected = new Map(
      (response.query?.redirects ?? []).map((entry) => [entry.to, entry.from]),
    );
    for (const page of response.query?.pages ?? []) {
      const qid = page.pageprops?.wikibase_item;
      if (!qid) continue;
      let title = page.title;
      for (const table of [redirected, normalized]) {
        if (table.has(title)) title = table.get(title);
      }
      byTitle.set(title, qid);
      byTitle.set(page.title, qid);
    }
  }
  return byTitle;
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

// Structured facts describing the world an author lived in. Only these
// properties are read; nothing here infers an occasion for a quotation.
const CLAIM_PROPERTIES = {
  born: "P569",
  died: "P570",
  birthplace: "P19",
  country: "P27",
  occupation: "P106",
  movement: "P135",
  era: "P2348",
  // What this person is actually known for, which is what makes the section
  // worth reading rather than a restatement of their job title.
  notableWork: "P800",
  award: "P166",
  position: "P39",
  significantEvent: "P793",
  fieldOfWork: "P101",
  employer: "P108",
  educatedAt: "P69",
};

function claimValues(entity, property) {
  return (entity.claims?.[property] ?? [])
    .map((claim) => claim.mainsnak?.datavalue?.value)
    .filter(Boolean);
}

async function resolveClaims(qids) {
  const byQid = new Map();
  for (const batch of chunk(qids, 50)) {
    const response = await getJson("www.wikidata.org", {
      action: "wbgetentities",
      ids: batch.join("|"),
      props: "claims",
      format: "json",
      formatversion: 2,
    });
    for (const [qid, entity] of Object.entries(response.entities ?? {})) {
      const facts = {};
      for (const [name, property] of Object.entries(CLAIM_PROPERTIES)) {
        const values = claimValues(entity, property);
        if (!values.length) continue;
        if (name === "born" || name === "died") {
          // Wikidata times look like "+1564-04-23T00:00:00Z"; keep the raw
          // string so the generator can decide how precise to be.
          facts[name] = values[0].time ?? null;
        } else {
          // Referenced entities, resolved to labels later. Notable works get a
          // wider window since three titles read better than two.
          facts[name] = values
            .map((value) => value.id)
            .filter(Boolean)
            .slice(0, name === "notableWork" ? 3 : 2);
        }
      }
      byQid.set(qid, facts);
    }
  }
  return byQid;
}

// Referenced QIDs (places, countries, occupations, movements) -> readable
// labels in each catalog language.
// Language families a fallback may stay inside. Wikidata often stores only a
// Traditional "zh" label; languagefallback=1 converts it to Simplified for
// zh-hans, which is the whole reason this uses fallback at all. Any fallback
// that crosses families (a Japanese label served from English) is rejected —
// an English word inside Japanese prose reads as a bug.
const LABEL_FAMILY = {
  "zh-hans": /^zh/,
  ja: /^ja/,
  en: /^en/,
};

async function resolveLabels(qids, languages) {
  const byQid = new Map();
  for (const batch of chunk(qids, 50)) {
    const response = await getJson("www.wikidata.org", {
      action: "wbgetentities",
      ids: batch.join("|"),
      props: "labels",
      languages: languages.join("|"),
      languagefallback: 1,
      format: "json",
      formatversion: 2,
    });
    for (const [qid, entity] of Object.entries(response.entities ?? {})) {
      const labels = {};
      for (const [language, label] of Object.entries(entity.labels ?? {})) {
        if (!label?.value) continue;
        const family = LABEL_FAMILY[language];
        const from = label["source-language"] ?? language;
        if (family && !family.test(from)) continue;
        labels[language] = label.value;
      }
      if (Object.keys(labels).length) byQid.set(qid, labels);
    }
  }
  return byQid;
}

// Wikipedia title -> plain-text lead section.
async function resolveExtracts(host, titles, language) {
  const byTitle = new Map();
  for (const batch of chunk(titles.filter(isFetchableTitle), 20)) {
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

// Distinct source works per language, so each is fetched from its own wiki.
const worksByLanguage = new Map();
for (const context of contextDocument.quote_contexts) {
  const title = cleanWorkTitle(context.source_work);
  if (!title) continue;
  if (!worksByLanguage.has(context.language)) {
    worksByLanguage.set(context.language, new Set());
  }
  worksByLanguage.get(context.language).add(title);
}

const biographies = {};
const works = {};
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

  // Structured facts for the era/place sentences, plus labels for every
  // entity those facts point at.
  const qidByRef = new Map();
  for (const { author, pageId } of withPageId) {
    const qid = qidByPageId.get(pageId);
    if (qid) qidByRef.set(author.author_ref, qid);
  }
  // Fill the gap for authors that only resolved by display name.
  const unresolvedTitles = [...wanted]
    .filter(([authorRef]) => !qidByRef.has(authorRef))
    .map(([, title]) => title);
  if (unresolvedTitles.length) {
    const qidByTitle = await resolveQidsByTitle(hosts.pedia, [
      ...new Set(unresolvedTitles),
    ]);
    for (const [authorRef, title] of wanted) {
      if (qidByRef.has(authorRef)) continue;
      const qid = qidByTitle.get(title);
      if (qid) qidByRef.set(authorRef, qid);
    }
  }

  const claimsByQid = await resolveClaims([...new Set(qidByRef.values())]);

  const referencedQids = new Set();
  for (const facts of claimsByQid.values()) {
    for (const [name, value] of Object.entries(facts)) {
      if (name === "born" || name === "died") continue;
      for (const qid of value) referencedQids.add(qid);
    }
  }
  // The authors themselves, so each name is available in the same script the
  // articles use: zh.wikipedia serves Simplified here, but a display name like
  // 司馬遷 is Traditional and would never match its own article text.
  for (const qid of qidByRef.values()) referencedQids.add(qid);
  const labelsByQid = await resolveLabels(
    [...referencedQids],
    ["en", "ja", "zh-hans"],
  );

  let found = 0;
  for (const [authorRef, title] of wanted) {
    const extract = extracts.get(title);
    const qid = qidByRef.get(authorRef);
    const rawFacts = qid ? claimsByQid.get(qid) : undefined;

    // Resolve entity references to labels now, so the generator never has to
    // touch the network or carry a QID table.
    let facts;
    if (rawFacts) {
      facts = {};
      for (const [name, value] of Object.entries(rawFacts)) {
        if (name === "born" || name === "died") {
          facts[name] = value;
        } else {
          const labels = value
            .map((entityId) => labelsByQid.get(entityId))
            .filter(Boolean);
          if (labels.length) facts[name] = labels;
        }
      }
    }

    if (!extract && !facts) {
      missing += 1;
      continue;
    }
    biographies[authorRef] = {
      title: title ?? null,
      extract: extract ?? null,
      qid: qid ?? null,
      names: (qid && labelsByQid.get(qid)) ?? null,
      facts: facts ?? null,
    };
    if (extract) {
      found += 1;
      resolved += 1;
    }
  }
  console.log(
    `resolved ${found}/${authors.length} biographies, ${claimsByQid.size} fact sets`,
  );

  // Source works for this language.
  const workTitles = [...(worksByLanguage.get(language) ?? [])];
  if (workTitles.length) {
    process.stdout.write(`${language}: ${workTitles.length} works … `);
    const workExtracts = await resolveExtracts(
      hosts.pedia,
      workTitles,
      language,
    );
    let workFound = 0;
    for (const workTitle of workTitles) {
      const extract = workExtracts.get(workTitle);
      if (!extract) continue;
      works[`${language}:${workTitle}`] = { title: workTitle, extract };
      workFound += 1;
    }
    console.log(`resolved ${workFound}/${workTitles.length}`);
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      source:
        "Wikipedia lead sections and Wikidata claims, retrieved via the MediaWiki API",
      license: "CC BY-SA 4.0",
      retrieved_at: new Date().toISOString().slice(0, 10),
      biographies,
      works,
    },
    null,
    2,
  )}\n`,
);

console.log(
  `\nResolved ${resolved} biographies and ${Object.keys(works).length} works, ${missing} unresolved. Wrote ${path.relative(root, outputPath)}.`,
);
