import fs from "node:fs";
import { execFileSync } from "node:child_process";

const inputPath = new URL("../assets/quotes.json", import.meta.url);
const outputPath = inputPath;

const CATEGORY_QUOTAS = {
  MINDFULNESS: 65,
  WISDOM: 120,
  COURAGE: 75,
  LOVE: 70,
  NATURE: 55,
  GROWTH: 100,
  HEALING: 60,
  GRATITUDE: 55,
};

const SUBCATEGORIES = {
  MINDFULNESS: {
    PRESENCE: ["present", "moment", "now", "today"],
    AWARENESS: ["aware", "attention", "observe", "mind", "conscious"],
    MEDITATION: ["meditat", "breath", "breathe", "silence"],
    STILLNESS: ["still", "quiet", "calm", "peace"],
    INNER_PEACE: ["within", "inner", "accept", "serenity"],
  },
  WISDOM: {
    PHILOSOPHY: ["philosoph", "exist", "meaning", "life"],
    TRUTH: ["truth", "honest", "real", "false"],
    PERSPECTIVE: ["perspective", "view", "see", "appear"],
    JUDGMENT: ["judge", "decision", "choice", "reason"],
    SELF_KNOWLEDGE: ["yourself", "myself", "self", "know"],
  },
  COURAGE: {
    BRAVERY: ["brave", "courage", "fear"],
    RESILIENCE: ["resilien", "endure", "persist", "persever"],
    RISK: ["risk", "dare", "leap", "chance"],
    ADVERSITY: ["advers", "struggle", "hardship", "difficult", "challenge"],
    LEADERSHIP: ["leader", "lead", "command", "stand"],
  },
  LOVE: {
    ROMANTIC_LOVE: ["lover", "romance", "kiss", "heart"],
    FAMILY: ["family", "mother", "father", "child", "home"],
    FRIENDSHIP: ["friend", "companion"],
    COMPASSION: ["compassion", "kind", "care", "human"],
    SELF_LOVE: ["yourself", "self-love", "self love", "worthy"],
  },
  NATURE: {
    WILDERNESS: ["forest", "tree", "mountain", "earth", "wild"],
    SEASONS: ["spring", "summer", "autumn", "winter", "season"],
    ANIMALS: ["bird", "animal", "horse", "dog", "cat"],
    OCEAN: ["ocean", "sea", "river", "water", "wave"],
    COSMOS: ["star", "moon", "sun", "sky", "universe"],
  },
  GROWTH: {
    LEARNING: ["learn", "knowledge", "student", "teach", "education"],
    DISCIPLINE: ["discipline", "habit", "practice", "work"],
    CHANGE: ["change", "transform", "become", "begin"],
    AMBITION: ["dream", "goal", "success", "achieve", "great"],
    CREATIVITY: ["create", "imagin", "art", "idea", "invent"],
  },
  HEALING: {
    GRIEF: ["grief", "loss", "sorrow", "pain"],
    FORGIVENESS: ["forgive", "mercy", "resent"],
    RECOVERY: ["recover", "heal", "wound", "repair"],
    HOPE: ["hope", "light", "tomorrow", "dawn"],
    REST: ["rest", "sleep", "pause", "gentle"],
  },
  GRATITUDE: {
    APPRECIATION: ["grat", "appreciat", "thank"],
    CONTENTMENT: ["content", "enough", "satisf"],
    JOY: ["joy", "happy", "happiness", "delight"],
    HUMILITY: ["humble", "humility", "modest"],
    ABUNDANCE: ["abundan", "gift", "bless", "wonder"],
  },
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

function normalizedText(text) {
  return text
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function isEligible(quote) {
  const role = quote.role?.trim().toLowerCase();
  return (
    quote.id !== undefined &&
    quote.text?.trim() &&
    quote.author?.trim() &&
    role &&
    !["writer", "author", "poet", "unknown"].includes(role) &&
    !/pep talk radio/i.test(quote.author)
  );
}

function chooseSubcategory(quote, category, counts) {
  const text = `${quote.text} ${quote.source ?? ""}`.toLowerCase();
  const entries = Object.entries(SUBCATEGORIES[category]);
  let bestScore = 0;
  let matches = [];

  for (const [subcategory, keywords] of entries) {
    const score = keywords.reduce(
      (total, keyword) => total + (text.includes(keyword) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      matches = [subcategory];
    } else if (score === bestScore && score > 0) {
      matches.push(subcategory);
    }
  }

  const candidates = matches.length > 0 ? matches : entries.map(([name]) => name);
  return candidates.sort(
    (left, right) =>
      (counts[left] ?? 0) - (counts[right] ?? 0) ||
      entries.findIndex(([name]) => name === left) -
        entries.findIndex(([name]) => name === right),
  )[0];
}

const input = JSON.parse(
  process.env.ECHO_QUOTES_FROM_GIT === "1"
    ? execFileSync("git", ["show", "HEAD:assets/quotes.json"], {
        encoding: "utf8",
      })
    : fs.readFileSync(inputPath, "utf8"),
);
const eligible = input.filter(isEligible);
const selected = [];
const selectedIds = new Set();
const authorCounts = new Map();

// Scarce categories are filled first so multi-tagged records remain available
// where the source pool genuinely supports them.
const categoryOrder = [
  "NATURE",
  "HEALING",
  "GRATITUDE",
  "LOVE",
  "MINDFULNESS",
  "COURAGE",
  "WISDOM",
  "GROWTH",
];

for (const category of categoryOrder) {
  const candidates = eligible
    .filter(
      (quote) =>
        !selectedIds.has(quote.id) &&
        quote.categories?.includes(category) &&
        (authorCounts.get(quote.author) ?? 0) < 16,
    )
    .sort(
      (left, right) =>
        Number(right.primary_category === category) -
          Number(left.primary_category === category) ||
        left.categories.length - right.categories.length ||
        (authorCounts.get(left.author) ?? 0) -
          (authorCounts.get(right.author) ?? 0) ||
        Number(Boolean(right.source)) - Number(Boolean(left.source)) ||
        left.text.length - right.text.length ||
        Number(left.id) - Number(right.id),
    );

  const categorySelection = [];
  for (const quote of candidates) {
    if ((authorCounts.get(quote.author) ?? 0) >= 16) continue;
    categorySelection.push(quote);
    authorCounts.set(quote.author, (authorCounts.get(quote.author) ?? 0) + 1);
    if (categorySelection.length === CATEGORY_QUOTAS[category]) break;
  }
  if (categorySelection.length !== CATEGORY_QUOTAS[category]) {
    throw new Error(
      `${category}: expected ${CATEGORY_QUOTAS[category]}, found ${categorySelection.length}`,
    );
  }

  for (const quote of categorySelection) {
    selectedIds.add(quote.id);
    selected.push({ ...quote, primary_category: category });
  }
}

const subcategoryCounts = {};
const output = selected
  .sort((left, right) => Number(left.id) - Number(right.id))
  .map((quote) => {
    const category = quote.primary_category;
    subcategoryCounts[category] ??= {};
    const subcategory = chooseSubcategory(
      quote,
      category,
      subcategoryCounts[category],
    );
    subcategoryCounts[category][subcategory] =
      (subcategoryCounts[category][subcategory] ?? 0) + 1;

    return {
      id: quote.id,
      text: normalizedText(quote.text),
      language: "en",
      author_id: authorId(quote.author),
      author: quote.author.trim(),
      role: quote.role.trim(),
      ...(quote.source?.trim() ? { source: quote.source.trim() } : {}),
      primary_category: category,
      subcategory,
      categories: [category],
    };
  });

if (output.length !== 600) {
  throw new Error(`Expected 600 quotes, generated ${output.length}`);
}

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

console.log(`Wrote ${output.length} quotes to ${outputPath.pathname}`);
console.log("Category quotas:", CATEGORY_QUOTAS);
console.log(
  "Largest author count:",
  Math.max(...authorCounts.values()),
);
console.log("Subcategory distribution:", subcategoryCounts);
