import fs from "node:fs";
import {
  cleanWikiMarkup,
  createWikiquoteClient,
  fetchWikidataDescriptions,
  normalizedQuoteKey,
} from "./wikiquote-support.mjs";

const TARGET_COUNT = 2000;
const API = "https://ja.wikiquote.org/w/api.php";
const outputPath = new URL("../assets/quotes.ja.json", import.meta.url);
const provenancePath = new URL(
  "../data/quote-audit/japanese-provenance.json",
  import.meta.url,
);

const CATEGORY_KEYWORDS = {
  MINDFULNESS: ["今", "心", "静", "無", "禅", "悟", "己"],
  WISDOM: ["人生", "知", "真", "学", "道", "賢", "愚", "言葉"],
  COURAGE: ["勇", "恐", "戦", "勝", "負", "志", "忍", "困難"],
  LOVE: ["愛", "恋", "親", "友", "慈", "情", "家族"],
  NATURE: ["山", "川", "海", "月", "花", "雪", "風", "雨", "春", "秋", "星"],
  GROWTH: ["成長", "努力", "働", "進", "変", "創", "夢", "成功"],
  HEALING: ["悲", "痛", "涙", "癒", "許", "希望", "休"],
  GRATITUDE: ["感謝", "幸", "喜", "足る", "恵", "ありが"],
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
  PRESENCE: ["今", "今日", "瞬間"],
  AWARENESS: ["気づ", "見る", "知る"],
  MEDITATION: ["禅", "悟", "無"],
  STILLNESS: ["静", "閑", "寂"],
  INNER_PEACE: ["心", "己", "安ら"],
  PHILOSOPHY: ["人生", "存在", "道"],
  TRUTH: ["真", "誠", "正"],
  PERSPECTIVE: ["見る", "考え", "世界"],
  JUDGMENT: ["判断", "選", "善", "悪"],
  SELF_KNOWLEDGE: ["己", "自分", "我"],
  BRAVERY: ["勇", "恐"],
  RESILIENCE: ["忍", "耐", "続"],
  RISK: ["危", "賭", "冒険"],
  ADVERSITY: ["困", "苦", "敗"],
  LEADERSHIP: ["将", "主", "治", "導"],
  ROMANTIC_LOVE: ["恋", "逢", "君"],
  FAMILY: ["親", "母", "父", "子"],
  FRIENDSHIP: ["友", "仲間"],
  COMPASSION: ["慈", "情", "憐"],
  SELF_LOVE: ["自愛", "自分"],
  WILDERNESS: ["山", "野", "森", "木"],
  SEASONS: ["春", "夏", "秋", "冬", "季"],
  ANIMALS: ["鳥", "馬", "猫", "犬", "蛙"],
  OCEAN: ["海", "川", "水", "波"],
  COSMOS: ["月", "星", "日", "空"],
  LEARNING: ["学", "知", "教", "書"],
  DISCIPLINE: ["努", "勤", "修"],
  CHANGE: ["変", "新", "改"],
  AMBITION: ["夢", "志", "成"],
  CREATIVITY: ["作", "芸", "美", "詩"],
  GRIEF: ["悲", "涙", "死"],
  FORGIVENESS: ["許", "赦"],
  RECOVERY: ["癒", "治", "病"],
  HOPE: ["希望", "明日", "光"],
  REST: ["休", "眠"],
  APPRECIATION: ["感謝", "ありが"],
  CONTENTMENT: ["足る", "満"],
  JOY: ["幸", "喜", "笑"],
  HUMILITY: ["謙", "慎"],
  ABUNDANCE: ["恵", "豊"],
};

function cleanMarkup(value) {
  return cleanWikiMarkup(value);
}

function cleanHeading(line) {
  return cleanMarkup(line.replace(/^=+\s*|\s*=+$/g, "")).replace(/[『』]/g, "");
}

function roleFromCategories(categories) {
  const names = categories.map((item) => item.title.replace(/^カテゴリ:/, ""));
  const priorities = [
    ["歌人", "日本の歌人"],
    ["俳人", "日本の俳人"],
    ["日本の作家", "日本の作家"],
    ["哲学者", "日本の哲学者"],
    ["思想家", "日本の思想家"],
    ["教育者", "日本の教育者"],
    ["武士", "日本の武士"],
    ["軍人", "日本の軍人"],
    ["政治家", "日本の政治家"],
    ["科学者", "日本の科学者"],
    ["芸術家", "日本の芸術家"],
    ["俳優", "日本の俳優"],
    ["スポーツ選手", "日本のスポーツ選手"],
    ["野球選手", "日本の野球選手"],
    ["サッカー選手", "日本のサッカー選手"],
    ["実業家", "日本の実業家"],
    ["音楽家", "日本の音楽家"],
    ["歌手", "日本の歌手"],
    ["宗教家", "日本の宗教家"],
    ["医師", "日本の医師"],
    ["学者", "日本の学者"],
  ];
  const match = priorities.find(([category]) =>
    names.some((name) => name.includes(category)),
  );
  return match?.[1] ?? "日本の歴史的人物";
}

function extractQuotes(page) {
  const content = page.revisions?.[0]?.slots?.main?.content ?? "";
  const lines = content.replace(/\r/g, "").split("\n");
  const results = [];
  let heading = "";
  let excludedSection = false;

  for (const line of lines) {
    if (/^={2,5}[^=]/.test(line)) {
      heading = cleanHeading(line);
      excludedSection = /不明|疑わ|誤|偽|伝承|その他/.test(heading);
      continue;
    }
    if (excludedSection) continue;

    if (/^\*:[^*]/.test(line) && results.length > 0) {
      const detail = cleanMarkup(line.replace(/^\*:\s*/, ""));
      const work = detail.match(/『([^』]+)』/)?.[1];
      if (work && !results.at(-1).source) results.at(-1).source = work;
      continue;
    }
    if (!/^\*[^*:]/.test(line)) continue;
    if (/^\*\s*\[\[[^\]]+\]\]\s*$/.test(line)) continue;

    let text = cleanMarkup(line.replace(/^\*\s*/, ""));
    let source = "";
    const dashParts = text.split(/\s*(?:--|——)\s*/);
    if (dashParts.length > 1) {
      text = dashParts.shift().trim();
      source = dashParts.join(" — ").trim();
    }
    const inlineWork = text.match(/[（(]\s*『([^』]+)』(?:から|より)?\s*[）)]/);
    if (inlineWork) {
      source = inlineWork[1];
      text = text.replace(inlineWork[0], "").trim();
    }
    const trailingWork = text.match(/\s+-\s+『([^』]+)』\s*$/);
    if (trailingWork) {
      source = trailingWork[1];
      text = text.replace(trailingWork[0], "").trim();
    }
    if (
      !source &&
      heading &&
      heading !== page.title &&
      !heading.includes(page.title) &&
      !/情報源|発言|引用|確かなもの/.test(heading)
    ) {
      source = heading;
    }

    if (
      text.length < 6 ||
      text.length > 120 ||
      /https?:|Category:|カテゴリ:|ファイル:/.test(text) ||
      !/[ぁ-んァ-ヶ一-龯]/.test(text) ||
      /(?:と述べている|と語った|と振り返って|と説明した|を務めた|に参加して以来|によれば|とされている|という。)$/.test(
        text,
      )
    ) {
      continue;
    }
    results.push({
      text,
      source:
        source.length <= 80 && !/^(?:語録|その他|発言|引用)$/.test(source)
          ? source
          : "",
    });
  }
  return results;
}

function chooseCategory(text) {
  let best = "WISDOM";
  let score = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const nextScore = keywords.reduce(
      (sum, keyword) => sum + (text.includes(keyword) ? 1 : 0),
      0,
    );
    if (nextScore > score) {
      best = category;
      score = nextScore;
    }
  }
  return best;
}

function chooseSubcategory(text, category, counts) {
  const candidates = SUBCATEGORIES[category];
  let score = 0;
  let matches = [];
  for (const subcategory of candidates) {
    const nextScore = (SUBCATEGORY_KEYWORDS[subcategory] ?? []).reduce(
      (sum, keyword) => sum + (text.includes(keyword) ? 1 : 0),
      0,
    );
    if (nextScore > score) {
      score = nextScore;
      matches = [subcategory];
    } else if (nextScore === score && nextScore > 0) {
      matches.push(subcategory);
    }
  }
  const pool = matches.length ? matches : [...candidates];
  return pool.sort(
    (left, right) =>
      (counts[left] ?? 0) - (counts[right] ?? 0) ||
      candidates.indexOf(left) - candidates.indexOf(right),
  )[0];
}

const client = createWikiquoteClient(API, "Japanese");
const categoryResult = await client.collectCategoryPages(
  ["カテゴリ:日本人"],
  2,
);
const pages = await client.fetchPages(categoryResult.titles);
const wikidataDescriptions = await fetchWikidataDescriptions(pages, "ja");
const englishWikidataDescriptions = await fetchWikidataDescriptions(
  pages,
  "en",
);

const pagePools = pages
  .filter(
    (page) =>
      !/^(?:日本人|作家|詩人|哲学者|科学者|政治家|芸術家)$/.test(page.title),
  )
  .map((page) => ({
    page,
    role:
      wikidataDescriptions.get(page.pageprops?.wikibase_item) ??
      englishWikidataDescriptions.get(page.pageprops?.wikibase_item) ??
      roleFromCategories(page.categories ?? []),
    quotes: extractQuotes(page),
  }))
  .filter(
    (item) =>
      item.quotes.length > 0 &&
      item.role !== "日本の歴史的人物",
  )
  .sort((left, right) => left.page.pageid - right.page.pageid);

const selected = [];
const seen = new Set();
for (let round = 0; selected.length < TARGET_COUNT; round += 1) {
  let added = false;
  for (const pool of pagePools) {
    const quote = pool.quotes[round];
    if (!quote) continue;
    const key = normalizedQuoteKey(quote.text);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push({ ...quote, ...pool, quoteIndex: round + 1 });
    added = true;
    if (selected.length === TARGET_COUNT) break;
  }
  if (!added) break;
}

if (selected.length !== TARGET_COUNT) {
  throw new Error(
    `Expected ${TARGET_COUNT} Japanese quotes, found ${selected.length}`,
  );
}

const subcategoryCounts = {};
const output = selected.map((item) => {
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
    id: `ja-wikiquote-${item.page.pageid}-${String(item.quoteIndex).padStart(2, "0")}`,
    text: item.text,
    language: "ja",
    author_id: `ja_wikiquote_${item.page.pageid}`,
    author: item.page.title,
    role: item.role,
    ...(item.source ? { source: item.source } : {}),
    primary_category: category,
    subcategory,
    categories: [category],
  };
});

const provenance = selected.map((item, index) => ({
  id: output[index].id,
  provider: "Japanese Wikiquote",
  page_title: item.page.title,
  page_id: item.page.pageid,
  revision_id: item.page.revisions[0].revid,
  revision_url: `https://ja.wikiquote.org/w/index.php?title=${encodeURIComponent(item.page.title)}&oldid=${item.page.revisions[0].revid}`,
  license: "CC BY-SA",
}));

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
fs.writeFileSync(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);

console.log(`Wrote ${output.length} Japanese quotes to ${outputPath.pathname}`);
console.log(`Authors/pages: ${new Set(output.map((quote) => quote.author_id)).size}`);
console.log("Subcategory distribution:", subcategoryCounts);
