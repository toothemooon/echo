import fs from "node:fs";
import {
  cleanWikiMarkup,
  createWikiquoteClient,
  fetchWikidataDescriptions,
  normalizedQuoteKey,
} from "./wikiquote-support.mjs";

const SITE = "https://card.gudong.site";
const WIKIQUOTE_API = "https://zh.wikiquote.org/w/api.php";
// Only records with a verifiable, redistributable source enter the published
// catalog. inBox Card records are still collected below for the unpublished
// audit archive, but are never bundled into the app.
const TARGET_COUNT = 894;
const outputPath = new URL("../assets/quotes.zh-Hans.json", import.meta.url);
const provenancePath = new URL(
  "../data/quote-audit/chinese-provenance.json",
  import.meta.url,
);
const unpublishedOutputPath = new URL(
  "../data/quote-audit/chinese-inbox-unpublished.json",
  import.meta.url,
);
const unpublishedProvenancePath = new URL(
  "../data/quote-audit/chinese-inbox-provenance-unpublished.json",
  import.meta.url,
);

const COLLECTIONS = [
  ["duan-yongping", "/cards/entrepreneur/duan-yongping.txt", "中国企业家与投资者"],
  ["steve-jobs", "/cards/entrepreneur/steve-jobs.txt", "美国企业家，苹果公司联合创始人"],
  ["paul-graham", "/cards/entrepreneur/paul-graham.txt", "英国计算机科学家、作家与创业投资人"],
  ["elon-musk", "/cards/entrepreneur/elon-musk.txt", "企业家与科技公司创始人"],
  ["munger", "/cards/entrepreneur/munger.txt", "美国投资家与伯克希尔·哈撒韦副董事长"],
  ["naval", "/cards/entrepreneur/naval.txt", "企业家、投资人与思想写作者"],
  ["wang-xing", "/cards/entrepreneur/wang-xing.txt", "中国企业家，美团联合创始人"],
  ["zhang-yiming", "/cards/entrepreneur/zhang-yiming.txt", "中国企业家，字节跳动创始人"],
  ["nietzsche", "/cards/philosophy/nietzsche.txt", "德国哲学家与古典语文学家"],
  ["seneca", "/cards/philosophy/seneca.txt", "古罗马斯多葛主义哲学家与政治家"],
  ["buddhism", "/cards/philosophy/buddhism.txt", "佛教经典与思想传统"],
  ["confucius", "/cards/philosophy/confucius.txt", "中国古代思想家与教育家"],
  ["mao", "/cards/philosophy/mao.txt", "中国政治家、军事家与思想家"],
  ["tao", "/cards/philosophy/tao.txt", "中国道家思想传统"],
  ["wang-yangming", "/cards/philosophy/wang-yangming.txt", "明代思想家、哲学家与政治家"],
  ["zen", "/cards/philosophy/zen.txt", "禅宗思想与修行传统"],
  ["luxun", "/cards/literature/luxun.txt", "中国现代文学家、思想家"],
  ["moyan", "/cards/literature/moyan.txt", "中国当代作家，诺贝尔文学奖得主"],
  ["su-dongpo", "/cards/literature/su-dongpo.txt", "北宋文学家、书画家与政治家"],
  ["tiandao", "/cards/literature/tiandao.txt", "电视剧《天道》对白与思想摘录"],
  ["yuhua", "/cards/literature/yuhua.txt", "中国当代作家"],
  ["caocao", "/cards/history/caocao.txt", "东汉末年政治家、军事家与文学家"],
  ["marcus-aurelius", "/cards/history/marcus-aurelius.txt", "古罗马皇帝与斯多葛主义哲学家"],
  ["sun-tzu", "/cards/history/sun-tzu.txt", "中国古代军事家，《孙子兵法》作者"],
  ["zen-guofan", "/cards/history/zen-guofan.txt", "晚清政治家、军事家与理学家"],
];

const CATEGORY_KEYWORDS = {
  MINDFULNESS: ["当下", "觉察", "内心", "平静", "宁静", "专注", "呼吸", "禅", "心境"],
  WISDOM: ["智慧", "真理", "认知", "思想", "哲学", "判断", "理解", "知道", "原则", "道"],
  COURAGE: ["勇气", "恐惧", "困难", "挑战", "坚持", "失败", "逆境", "战争", "胜利", "志"],
  LOVE: ["爱", "亲情", "友情", "朋友", "家庭", "父母", "孩子", "善良", "慈悲"],
  NATURE: ["自然", "山", "水", "海", "月", "花", "树", "风", "雨", "天地", "星"],
  GROWTH: ["成长", "学习", "工作", "行动", "改变", "创造", "目标", "成功", "创业", "能力"],
  HEALING: ["治愈", "痛苦", "悲伤", "原谅", "希望", "休息", "失去", "创伤", "恢复"],
  GRATITUDE: ["感恩", "感谢", "珍惜", "幸福", "知足", "快乐", "喜悦", "幸运", "拥有"],
};

const SUBCATEGORY_KEYWORDS = {
  MINDFULNESS: {
    PRESENCE: ["当下", "此刻", "现在"],
    AWARENESS: ["觉察", "观察", "意识", "专注"],
    MEDITATION: ["冥想", "呼吸", "禅"],
    STILLNESS: ["安静", "宁静", "平静"],
    INNER_PEACE: ["内心", "接纳", "心境"],
  },
  WISDOM: {
    PHILOSOPHY: ["哲学", "人生", "存在", "道"],
    TRUTH: ["真理", "真实", "诚实"],
    PERSPECTIVE: ["角度", "看待", "眼界", "认知"],
    JUDGMENT: ["判断", "选择", "决策", "原则"],
    SELF_KNOWLEDGE: ["自己", "自知", "内省"],
  },
  COURAGE: {
    BRAVERY: ["勇气", "勇敢", "恐惧"],
    RESILIENCE: ["坚持", "坚韧", "忍耐"],
    RISK: ["风险", "冒险", "敢于"],
    ADVERSITY: ["逆境", "困难", "失败", "挫折"],
    LEADERSHIP: ["领导", "将领", "管理", "团队"],
  },
  LOVE: {
    ROMANTIC_LOVE: ["爱情", "恋人", "相爱"],
    FAMILY: ["家庭", "父母", "孩子", "亲人"],
    FRIENDSHIP: ["朋友", "友情", "知己"],
    COMPASSION: ["慈悲", "善良", "关怀"],
    SELF_LOVE: ["爱自己", "自爱", "尊重自己"],
  },
  NATURE: {
    WILDERNESS: ["山", "森林", "树", "大地"],
    SEASONS: ["春", "夏", "秋", "冬", "四季"],
    ANIMALS: ["鸟", "马", "鱼", "动物"],
    OCEAN: ["海", "江", "河", "水", "浪"],
    COSMOS: ["星", "月", "太阳", "天空", "宇宙"],
  },
  GROWTH: {
    LEARNING: ["学习", "知识", "教育", "读书"],
    DISCIPLINE: ["自律", "习惯", "坚持", "训练"],
    CHANGE: ["改变", "变化", "转变"],
    AMBITION: ["目标", "成功", "理想", "事业"],
    CREATIVITY: ["创造", "创新", "想象", "艺术"],
  },
  HEALING: {
    GRIEF: ["悲伤", "失去", "痛苦"],
    FORGIVENESS: ["原谅", "宽恕"],
    RECOVERY: ["恢复", "治愈", "疗愈"],
    HOPE: ["希望", "光明", "明天"],
    REST: ["休息", "睡眠", "放松"],
  },
  GRATITUDE: {
    APPRECIATION: ["感恩", "感谢", "珍惜"],
    CONTENTMENT: ["知足", "满足"],
    JOY: ["快乐", "幸福", "喜悦"],
    HUMILITY: ["谦逊", "谦虚"],
    ABUNDANCE: ["拥有", "幸运", "丰盛"],
  },
};

function parseCards(text, collection) {
  return text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((block, index) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (!/^\d{4}-\d{2}-\d{2}/.test(lines[0] ?? "")) return null;
      const sourceIndex = lines.findIndex((line) => /^—{1,2}\s*/.test(line));
      const tagIndex = lines.findIndex((line) => line.startsWith("#"));
      if (sourceIndex < 2 || tagIndex < 0) return null;

      const content = lines.slice(1, sourceIndex).join(" ").replace(/\s+/g, " ").trim();
      const source = lines[sourceIndex].replace(/^—{1,2}\s*/, "").trim();
      const tag = lines[tagIndex].replace(/^#/, "");
      const author = tag.split("/")[0]?.trim();
      if (!content || !source || !author || content.length < 6 || content.length > 180) {
        return null;
      }

      return { index: index + 1, content, source, author, tag, collection };
    })
    .filter(Boolean);
}

function chooseCategory(card) {
  const text = `${card.content} ${card.tag}`;
  let best = null;
  let bestScore = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce(
      (sum, keyword) => sum + (text.includes(keyword) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }
  if (best) return best;
  if (card.collection[1].includes("/entrepreneur/")) return "GROWTH";
  if (card.collection[1].includes("/literature/")) return "WISDOM";
  if (card.collection[1].includes("/history/")) return "COURAGE";
  return card.collection[0] === "buddhism" || card.collection[0] === "zen"
    ? "MINDFULNESS"
    : "WISDOM";
}

function chooseSubcategory(card, category, counts) {
  const text = `${card.content} ${card.tag}`;
  const entries = Object.entries(SUBCATEGORY_KEYWORDS[category]);
  let bestScore = 0;
  let matches = [];
  for (const [subcategory, keywords] of entries) {
    const score = keywords.reduce(
      (sum, keyword) => sum + (text.includes(keyword) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      matches = [subcategory];
    } else if (score === bestScore && score > 0) {
      matches.push(subcategory);
    }
  }
  const candidates = matches.length ? matches : entries.map(([name]) => name);
  return candidates.sort(
    (left, right) =>
      (counts[left] ?? 0) - (counts[right] ?? 0) ||
      entries.findIndex(([name]) => name === left) -
        entries.findIndex(([name]) => name === right),
  )[0];
}

function cleanHeading(line) {
  return cleanWikiMarkup(line.replace(/^=+\s*|\s*=+$/g, "")).replace(
    /[《》『』]/g,
    "",
  );
}

function wikiquoteRole(categories) {
  const names = categories.map((item) =>
    item.title.replace(/^(?:Category|分类|分類):/, ""),
  );
  const priorities = [
    [/作家|小說家|小说家/, "作家"],
    [/詩人|诗人/, "诗人"],
    [/哲學家|哲学家|思想家/, "哲学家与思想家"],
    [/科學家|科学家/, "科学家"],
    [/教育家|教育者/, "教育家"],
    [/政治家|政治人物/, "政治人物"],
    [/軍事家|军事家|軍人|军人/, "军事人物"],
    [/藝術家|艺术家|畫家|画家/, "艺术家"],
    [/企業家|企业家|實業家|实业家/, "企业家"],
    [/宗教人物|宗教家/, "宗教人物"],
  ];
  const match = priorities.find(([pattern]) =>
    names.some((name) => pattern.test(name)),
  );
  return match?.[1] ?? "历史与文化人物";
}

function extractWikiquoteQuotes(page) {
  const content = page.revisions?.[0]?.slots?.main?.content ?? "";
  const lines = content.replace(/\r/g, "").split("\n");
  const results = [];
  let heading = "";
  let excluded = false;

  for (const line of lines) {
    if (/^={2,5}[^=]/.test(line)) {
      heading = cleanHeading(line);
      excluded =
        /误传|誤傳|争议|爭議|存疑|出处不明|出處不明|外部链接|外部連結|相关链接|相關連結|关于.*的评价|關於.*的評價/.test(
          heading,
        );
      continue;
    }
    if (excluded) continue;

    if (/^\*:[^*]/.test(line) && results.length > 0) {
      const detail = cleanWikiMarkup(line.replace(/^\*:\s*/, ""));
      const work = detail.match(/[《『]([^》』]+)[》』]/)?.[1];
      if (work && !results.at(-1).source) results.at(-1).source = work;
      continue;
    }

    if (/^\*\*[^*]/.test(line) && results.length > 0) {
      const detail = cleanWikiMarkup(line.replace(/^\*\*\s*/, ""));
      const work = detail.match(/[《『]([^》』]+)[》』]/)?.[1];
      if (work && !results.at(-1).source) results.at(-1).source = work;
      continue;
    }

    if (!/^\*[^*:#]/.test(line)) continue;
    if (/^\*\s*\[\[[^\]]+\]\]\s*$/.test(line)) continue;
    let text = cleanWikiMarkup(line.replace(/^\*\s*/, ""));
    let source = "";

    const work = text.match(/[（(]\s*[《『]([^》』]+)[》』]\s*[）)]/);
    if (work) {
      source = work[1];
      text = text.replace(work[0], "").trim();
    }

    const dash = text.match(/\s+(?:—|--)\s+(.+)$/);
    if (dash) {
      source ||= dash[1].trim();
      text = text.slice(0, dash.index).trim();
    }

    if (
      text.length < 10 ||
      text.length > 180 ||
      !/[\u3400-\u9fff]/.test(text) ||
      /https?:|\{\{|\[\[|Category:|分类:|分類:|文件:|檔案:|ISBN|^(?:记者|記者|主持人|问|問)[：:]|请您|請您|作一下评价|作一下評價/.test(
        text,
      )
    ) {
      continue;
    }

    if (
      !source &&
      heading &&
      !/语录|語錄|名言|言论|言論|作品|有明确出处|有明確出處/.test(heading) &&
      heading !== page.title
    ) {
      source = heading;
    }

    results.push({
      text: text.replace(/^[“「『]|[”」』]$/g, "").trim(),
      source:
        source.length <= 80 && !/^(?:参见|參見|语录|語錄|其它|其他)$/.test(source)
          ? source.replace(/^[“「『]|[”」』]$/g, "").trim()
          : "",
    });
  }

  return results;
}

const collectionCards = [];
for (const collection of COLLECTIONS) {
  const response = await fetch(`${SITE}${collection[1]}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${collection[1]}: ${response.status}`);
  }
  collectionCards.push(parseCards(await response.text(), collection));
}

const selected = [];
const seen = new Set();
let round = 0;
while (true) {
  let added = false;
  for (const cards of collectionCards) {
    const card = cards[round];
    if (!card) continue;
    const key = normalizedQuoteKey(card.content);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(card);
    added = true;
  }
  if (!added) break;
  round += 1;
}

const subcategoryCounts = {};
const inboxOutput = selected.map((card) => {
  const [slug, path, role] = card.collection;
  const category = chooseCategory(card);
  subcategoryCounts[category] ??= {};
  const subcategory = chooseSubcategory(
    card,
    category,
    subcategoryCounts[category],
  );
  subcategoryCounts[category][subcategory] =
    (subcategoryCounts[category][subcategory] ?? 0) + 1;

  return {
    id: `zh-inbox-${slug}-${String(card.index).padStart(3, "0")}`,
    text: card.content,
    language: "zh-Hans",
    author_id: `zh_${slug}`,
    author: card.author,
    role,
    source: card.source,
    primary_category: category,
    subcategory,
    categories: [category],
  };
});

const inboxProvenance = inboxOutput.map((quote, index) => ({
  id: quote.id,
  provider: "inBox Card",
  collection_url: `${SITE}/#/collection/${selected[index].collection[0]}`,
  source_file: `${SITE}${selected[index].collection[1]}`,
}));

const wikiquoteClient = createWikiquoteClient(
  WIKIQUOTE_API,
  "Chinese",
);
const categoryResult = await wikiquoteClient.collectCategoryPages(
  [
    "Category:中國人",
    "Category:作家",
    "Category:哲学家",
    "Category:科学家",
    "Category:詩人",
  ],
  1,
);
const pages = await wikiquoteClient.fetchPages(categoryResult.titles);
const wikidataDescriptions = await fetchWikidataDescriptions(
  pages,
  "zh",
);
const englishWikidataDescriptions = await fetchWikidataDescriptions(
  pages,
  "en",
);
const pagePools = pages
  .filter(
    (page) =>
      !/^(?:作家|诗人|詩人|哲学家|哲學家|科学家|科學家|中国人|中國人)$/.test(
        page.title,
      ),
  )
  .map((page) => ({
    page,
    role:
      wikidataDescriptions.get(page.pageprops?.wikibase_item) ??
      englishWikidataDescriptions.get(page.pageprops?.wikibase_item) ??
      wikiquoteRole(page.categories ?? []),
    quotes: extractWikiquoteQuotes(page),
  }))
  .filter(
    (pool) =>
      pool.quotes.length > 0 &&
      pool.role !== "历史与文化人物",
  )
  .sort((left, right) => left.page.pageid - right.page.pageid);

const wikiquoteSelected = [];
for (
  let quoteRound = 0;
  wikiquoteSelected.length < TARGET_COUNT;
  quoteRound += 1
) {
  let added = false;
  for (const pool of pagePools) {
    const quote = pool.quotes[quoteRound];
    if (!quote) continue;
    const key = normalizedQuoteKey(quote.text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    wikiquoteSelected.push({
      ...quote,
      ...pool,
      quoteIndex: quoteRound + 1,
    });
    added = true;
    if (wikiquoteSelected.length === TARGET_COUNT) {
      break;
    }
  }
  if (!added) break;
}

if (wikiquoteSelected.length !== TARGET_COUNT) {
  throw new Error(
    `Expected ${TARGET_COUNT} Chinese quotes, found `
      `${wikiquoteSelected.length}.`,
  );
}

const wikiquoteOutput = wikiquoteSelected.map((item) => {
  const category = chooseCategory({
    content: item.text,
    tag: item.source,
    collection: ["wikiquote", "/wikiquote/", item.role],
  });
  subcategoryCounts[category] ??= {};
  const subcategory = chooseSubcategory(
    {
      content: item.text,
      tag: item.source,
    },
    category,
    subcategoryCounts[category],
  );
  subcategoryCounts[category][subcategory] =
    (subcategoryCounts[category][subcategory] ?? 0) + 1;

  return {
    id: `zh-wikiquote-${item.page.pageid}-${String(item.quoteIndex).padStart(3, "0")}`,
    text: item.text,
    language: "zh-Hans",
    author_id: `zh_wikiquote_${item.page.pageid}`,
    author: item.page.title,
    role: item.role,
    ...(item.source ? { source: item.source } : {}),
    primary_category: category,
    subcategory,
    categories: [category],
  };
});

const wikiquoteProvenance = wikiquoteSelected.map((item, index) => ({
  id: wikiquoteOutput[index].id,
  provider: "Chinese Wikiquote",
  page_title: item.page.title,
  page_id: item.page.pageid,
  revision_id: item.page.revisions[0].revid,
  revision_url:
    `https://zh.wikiquote.org/w/index.php?title=`
    `${encodeURIComponent(item.page.title)}&oldid=${item.page.revisions[0].revid}`,
  license: "CC BY-SA",
}));

const output = wikiquoteOutput;
const provenance = wikiquoteProvenance;

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
fs.writeFileSync(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
fs.writeFileSync(
  unpublishedOutputPath,
  `${JSON.stringify(inboxOutput, null, 2)}\n`,
);
fs.writeFileSync(
  unpublishedProvenancePath,
  `${JSON.stringify(inboxProvenance, null, 2)}\n`,
);

console.log(`Wrote ${output.length} Chinese quotes to ${outputPath.pathname}`);
console.log(
  `Archived ${inboxOutput.length} inBox Card records outside the published catalog.`,
);
console.log(`Chinese Wikiquote additions: ${wikiquoteOutput.length}`);
console.log("Subcategory distribution:", subcategoryCounts);
