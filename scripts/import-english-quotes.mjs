import fs from "node:fs";
import {
  cleanWikiMarkup,
  createWikiquoteClient,
  fetchWikidataDescriptions,
  normalizedQuoteKey,
} from "./wikiquote-support.mjs";

const TARGET_COUNT = 2000;
const API = "https://en.wikiquote.org/w/api.php";
const outputPath = new URL("../assets/quotes.json", import.meta.url);
const provenancePath = new URL(
  "../data/quote-audit/english-provenance.json",
  import.meta.url,
);

const ROOT_CATEGORIES = [
  ["Category:Writers", "Writer"],
  ["Category:Poets", "Poet"],
  ["Category:Philosophers", "Philosopher"],
  ["Category:Scientists", "Scientist"],
  ["Category:Politicians", "Political figure"],
  ["Category:Artists", "Artist"],
  ["Category:Activists", "Activist"],
  ["Category:Educators", "Educator"],
];

const ROLE_OVERRIDES = {
  "Carsten Held": "German philosopher of science and former university professor",
  Invajy: "Indian self-improvement blogger",
  "Bayo Adebowale": "Nigerian novelist, poet, critic, and librarian",
};

const CATEGORY_KEYWORDS = {
  MINDFULNESS: ["present", "moment", "awareness", "silence", "peace", "mind"],
  WISDOM: ["truth", "wisdom", "reason", "knowledge", "life", "meaning"],
  COURAGE: ["courage", "fear", "brave", "struggle", "battle", "risk"],
  LOVE: ["love", "friend", "family", "heart", "compassion", "kindness"],
  NATURE: ["nature", "mountain", "river", "ocean", "tree", "sky", "star"],
  GROWTH: ["learn", "work", "change", "create", "dream", "success"],
  HEALING: ["heal", "pain", "grief", "forgive", "hope", "rest"],
  GRATITUDE: ["gratitude", "thank", "joy", "happy", "content", "blessing"],
};

const SUBCATEGORIES = {
  MINDFULNESS: ["PRESENCE", "AWARENESS", "MEDITATION", "STILLNESS", "INNER_PEACE"],
  WISDOM: ["PHILOSOPHY", "TRUTH", "PERSPECTIVE", "JUDGMENT", "SELF_KNOWLEDGE"],
  COURAGE: ["BRAVERY", "RESILIENCE", "RISK", "ADVERSITY", "LEADERSHIP"],
  LOVE: ["ROMANTIC_LOVE", "FAMILY", "FRIENDSHIP", "COMPASSION", "SELF_LOVE"],
  NATURE: ["WILDERNESS", "SEASONS", "ANIMALS", "OCEAN", "COSMOS"],
  GROWTH: ["LEARNING", "DISCIPLINE", "CHANGE", "AMBITION", "CREATIVITY"],
  HEALING: ["GRIEF", "FORGIVENESS", "RECOVERY", "HOPE", "REST"],
  GRATITUDE: ["APPRECIATION", "CONTENTMENT", "JOY", "HUMILITY", "ABUNDANCE"],
};

const SUBCATEGORY_KEYWORDS = {
  PRESENCE: ["present", "moment", "now", "today"],
  AWARENESS: ["aware", "observe", "attention", "conscious"],
  MEDITATION: ["meditat", "breath", "contemplat"],
  STILLNESS: ["silent", "still", "quiet", "calm"],
  INNER_PEACE: ["inner", "within", "serenity", "accept"],
  PHILOSOPHY: ["philosoph", "exist", "meaning", "life"],
  TRUTH: ["truth", "honest", "real", "false"],
  PERSPECTIVE: ["perspective", "view", "appear", "see"],
  JUDGMENT: ["judge", "choice", "decision", "reason"],
  SELF_KNOWLEDGE: ["yourself", "myself", "self", "know"],
  BRAVERY: ["brave", "courage", "fear"],
  RESILIENCE: ["endure", "persist", "resilien", "persever"],
  RISK: ["risk", "dare", "chance", "leap"],
  ADVERSITY: ["advers", "struggle", "hardship", "difficult"],
  LEADERSHIP: ["leader", "lead", "command", "govern"],
  ROMANTIC_LOVE: ["lover", "romance", "kiss", "beloved"],
  FAMILY: ["family", "mother", "father", "child"],
  FRIENDSHIP: ["friend", "companion"],
  COMPASSION: ["compassion", "kind", "care", "mercy"],
  SELF_LOVE: ["self-love", "love yourself", "worthy"],
  WILDERNESS: ["forest", "tree", "mountain", "earth"],
  SEASONS: ["spring", "summer", "autumn", "winter"],
  ANIMALS: ["bird", "animal", "horse", "dog", "cat"],
  OCEAN: ["ocean", "sea", "river", "water", "wave"],
  COSMOS: ["star", "moon", "sun", "sky", "universe"],
  LEARNING: ["learn", "knowledge", "student", "teach"],
  DISCIPLINE: ["discipline", "habit", "practice", "work"],
  CHANGE: ["change", "transform", "become", "begin"],
  AMBITION: ["dream", "goal", "success", "achieve"],
  CREATIVITY: ["create", "imagin", "art", "idea"],
  GRIEF: ["grief", "loss", "sorrow", "pain"],
  FORGIVENESS: ["forgive", "mercy", "resent"],
  RECOVERY: ["recover", "heal", "wound", "repair"],
  HOPE: ["hope", "tomorrow", "dawn", "light"],
  REST: ["rest", "sleep", "pause", "gentle"],
  APPRECIATION: ["grat", "appreciat", "thank"],
  CONTENTMENT: ["content", "enough", "satisf"],
  JOY: ["joy", "happy", "happiness", "delight"],
  HUMILITY: ["humble", "humility", "modest"],
  ABUNDANCE: ["abundan", "gift", "bless", "wonder"],
};

function authorId(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cleanHeading(line) {
  return cleanWikiMarkup(line.replace(/^=+\s*|\s*=+$/g, ""));
}

function looksEnglish(text) {
  if (
    /[\u0400-\u04ff\u0590-\u08ff\u0900-\u0dff\u3040-\u30ff\u3400-\u9fff]/.test(
      text,
    )
  ) {
    return false;
  }
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  if (words.length < 4) return false;
  const common = new Set([
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for",
    "from", "has", "have", "he", "her", "his", "i", "if", "in", "is",
    "it", "its", "not", "of", "on", "one", "or", "our", "that", "the",
    "their", "them", "there", "they", "this", "to", "was", "we", "what",
    "when", "which", "who", "will", "with", "you", "your",
  ]);
  return words.filter((word) => common.has(word)).length >= 2;
}

function extractQuotes(page) {
  const content = page.revisions?.[0]?.slots?.main?.content ?? "";
  const lines = content.replace(/\r/g, "").split("\n");
  const results = [];
  let heading = "";
  let excluded = false;

  for (const line of lines) {
    if (/^={2,5}[^=]/.test(line)) {
      heading = cleanHeading(line);
      excluded =
        /misattributed|disputed|unsourced|quotes about|external links|see also/i.test(
          heading,
        );
      continue;
    }
    if (excluded) continue;

    if (/^\*\*[^*]/.test(line) && results.length > 0) {
      const detail = cleanWikiMarkup(line.replace(/^\*\*\s*/, ""));
      const work =
        detail.match(/(?:from|in|source:?)\s+(.+?)(?:[,.;]|$)/i)?.[1] ??
        detail.match(/^(.+?)(?:,\s*(?:chapter|p\.|page)\b|$)/i)?.[1];
      if (work && work.length <= 120 && !results.at(-1).source) {
        results.at(-1).source = work.trim();
      }
      continue;
    }

    if (!/^\*[^*:#]/.test(line)) continue;
    if (/^\*\s*\[\[[^\]]+\]\]\s*$/.test(line)) continue;
    let text = cleanWikiMarkup(line.replace(/^\*\s*/, ""));
    let source = "";

    if (
      text.length < 18 ||
      text.length > 280 ||
      !looksEnglish(text) ||
      /\[\[|\{\{/.test(text) ||
      /https?:|Category:|File:|ISBN|^\W*(source|variant|translation)\b/i.test(
        text,
      )
    ) {
      continue;
    }

    if (
      !source &&
      heading &&
      !/quotes|sourced|works|speeches|writings/i.test(heading) &&
      heading !== page.title
    ) {
      source = heading;
    }

    results.push({
      text: text.replace(/^["“]|["”]$/g, "").trim(),
      source:
        source.length <= 120 && !/^(part|chapter|section)\s+[ivx\d]+$/i.test(source)
          ? source.replace(/^["“]|["”]$/g, "").trim()
          : "",
    });
  }

  return results;
}

function chooseCategory(text) {
  const normalized = text.toLowerCase();
  let best = "WISDOM";
  let bestScore = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce(
      (sum, keyword) => sum + Number(normalized.includes(keyword)),
      0,
    );
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }
  return best;
}

function chooseSubcategory(text, category, counts) {
  const normalized = text.toLowerCase();
  const candidates = SUBCATEGORIES[category];
  let bestScore = 0;
  let matches = [];

  for (const subcategory of candidates) {
    const score = (SUBCATEGORY_KEYWORDS[subcategory] ?? []).reduce(
      (sum, keyword) => sum + Number(normalized.includes(keyword)),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      matches = [subcategory];
    } else if (score === bestScore && score > 0) {
      matches.push(subcategory);
    }
  }

  const pool = matches.length > 0 ? matches : [...candidates];
  return pool.sort(
    (left, right) =>
      (counts[left] ?? 0) - (counts[right] ?? 0) ||
      candidates.indexOf(left) - candidates.indexOf(right),
  )[0];
}

const existing = JSON.parse(fs.readFileSync(outputPath, "utf8")).filter(
  (quote) =>
    !String(quote.id).startsWith("en-wikiquote-") &&
    looksEnglish(quote.text) &&
    quote.text.length <= 280 &&
    !/\[\[|\{\{/.test(quote.text) &&
    !/^(writer|author|poet|philosopher|unknown)$/i.test(quote.role),
);
const seen = new Set(existing.map((quote) => normalizedQuoteKey(quote.text)));
const roleByTitle = new Map();
const allTitles = new Set();
const client = createWikiquoteClient(API, "English");

for (const [category, role] of ROOT_CATEGORIES) {
  const result = await client.collectCategoryPages([category], 0);
  for (const title of result.titles) {
    allTitles.add(title);
    if (!roleByTitle.has(title)) roleByTitle.set(title, role);
  }
}

const pages = await client.fetchPages([...allTitles]);
const wikidataDescriptions = await fetchWikidataDescriptions(pages, "en");
const topicalTitles = new Set([
  "Artist",
  "Artists",
  "Writer",
  "Writers",
  "Poet",
  "Poets",
  "Philosopher",
  "Philosophers",
  "Scientist",
  "Scientists",
  "Politician",
  "Politicians",
  "Activist",
  "Activists",
  "Educator",
  "Educators",
]);
const pools = pages
  .filter((page) => !topicalTitles.has(page.title))
  .map((page) => ({
    page,
    role:
      ROLE_OVERRIDES[page.title] ??
      wikidataDescriptions.get(page.pageprops?.wikibase_item) ??
      roleByTitle.get(page.title) ??
      "Public figure documented by English Wikiquote",
    quotes: extractQuotes(page),
  }))
  .filter((pool) => pool.quotes.length > 0)
  .sort((left, right) => left.page.pageid - right.page.pageid);

const selected = [];
for (let round = 0; existing.length + selected.length < TARGET_COUNT; round += 1) {
  let added = false;
  for (const pool of pools) {
    const quote = pool.quotes[round];
    if (!quote) continue;
    const key = normalizedQuoteKey(quote.text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    selected.push({ ...quote, ...pool, quoteIndex: round + 1 });
    added = true;
    if (existing.length + selected.length === TARGET_COUNT) break;
  }
  if (!added) break;
}

if (existing.length + selected.length !== TARGET_COUNT) {
  throw new Error(
    `Expected ${TARGET_COUNT} English quotes, found ` +
      `${existing.length + selected.length}.`,
  );
}

const subcategoryCounts = {};
for (const quote of existing) {
  subcategoryCounts[quote.primary_category] ??= {};
  subcategoryCounts[quote.primary_category][quote.subcategory] =
    (subcategoryCounts[quote.primary_category][quote.subcategory] ?? 0) + 1;
}

const additions = selected.map((item) => {
  const category = chooseCategory(item.text);
  subcategoryCounts[category] ??= {};
  const subcategory = chooseSubcategory(
    item.text,
    category,
    subcategoryCounts[category],
  );
  subcategoryCounts[category][subcategory] =
    (subcategoryCounts[category][subcategory] ?? 0) + 1;

  return {
    id: `en-wikiquote-${item.page.pageid}-${String(item.quoteIndex).padStart(3, "0")}`,
    text: item.text,
    language: "en",
    author_id: `en_wikiquote_${item.page.pageid}_${authorId(item.page.title)}`,
    author: item.page.title,
    role: item.role,
    ...(item.source ? { source: item.source } : {}),
    primary_category: category,
    subcategory,
    categories: [category],
  };
});

const output = [...existing, ...additions];
const provenance = selected.map((item, index) => ({
  id: additions[index].id,
  provider: "English Wikiquote",
  page_title: item.page.title,
  page_id: item.page.pageid,
  revision_id: item.page.revisions[0].revid,
  revision_url:
    `https://en.wikiquote.org/w/index.php?title=` +
    `${encodeURIComponent(item.page.title)}&oldid=${item.page.revisions[0].revid}`,
  license: "CC BY-SA",
}));

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
fs.writeFileSync(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);

console.log(`Wrote ${output.length} English quotes.`);
console.log(`Existing controlled records: ${existing.length}`);
console.log(`English Wikiquote additions: ${additions.length}`);
