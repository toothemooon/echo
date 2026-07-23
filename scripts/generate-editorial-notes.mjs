import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contextsPath = path.join(root, "QUOTE_CONTEXTS.json");

const contextDocument = JSON.parse(fs.readFileSync(contextsPath, "utf8"));
const quotes = [
  ...JSON.parse(
    fs.readFileSync(path.join(root, "assets/quotes.json"), "utf8"),
  ),
  ...JSON.parse(
    fs.readFileSync(path.join(root, "assets/quotes.zh-Hans.json"), "utf8"),
  ),
  ...JSON.parse(
    fs.readFileSync(path.join(root, "assets/quotes.ja.json"), "utf8"),
  ),
];

const quotesById = new Map(quotes.map((quote) => [String(quote.id), quote]));

const CATEGORY_READINGS = {
  en: {
    MINDFULNESS:
      "an invitation to slow down, notice the present moment, and respond with greater awareness",
    WISDOM:
      "a prompt to reconsider familiar assumptions and look for a more deliberate perspective",
    COURAGE:
      "an encouragement to act despite uncertainty, without pretending that difficulty disappears",
    LOVE:
      "a reflection on how care becomes visible through attention, responsibility, and relationship",
    NATURE:
      "an invitation to see the natural world as both an external reality and a mirror for human experience",
    GROWTH:
      "a reminder that learning and change are usually built through repeated effort rather than a single breakthrough",
    HEALING:
      "a gentle recognition that recovery takes time and does not require denying pain",
    GRATITUDE:
      "a reminder to notice what sustains us without turning gratitude into an obligation to ignore hardship",
  },
  "zh-Hans": {
    MINDFULNESS: "邀请读者放慢速度，留意当下，并以更清醒的方式回应生活",
    WISDOM: "提醒我们重新审视习以为常的判断，为经验保留另一种解释",
    COURAGE: "鼓励人在不确定中仍然采取行动，但并不否认困难本身",
    LOVE: "把爱理解为持续的关注、责任与关系，而不只是瞬间的感受",
    NATURE: "邀请我们既观察真实的自然，也留意人如何借自然理解自身经验",
    GROWTH: "提醒我们成长通常来自反复练习与修正，而不是一次性的顿悟",
    HEALING: "承认伤痛与恢复可以同时存在，并为缓慢的修复保留空间",
    GRATITUDE: "提醒我们看见支持自己的事物，同时不把感恩变成否认困境的义务",
  },
  ja: {
    MINDFULNESS:
      "立ち止まって現在に注意を向け、より意識的に日々へ応答するための言葉として読める",
    WISDOM:
      "慣れた判断をいったん見直し、経験を別の角度から考えるきっかけとして読める",
    COURAGE:
      "困難を軽視せず、不確かさの中でも行動を選ぶための励ましとして読める",
    LOVE:
      "愛を一時の感情だけでなく、注意、責任、関係の積み重ねとして考える言葉と読める",
    NATURE:
      "自然そのものを見つめながら、人が自然を通して自己を理解する営みにも目を向ける言葉と読める",
    GROWTH:
      "成長は一度のひらめきより、繰り返す努力と修正から生まれるという示唆として読める",
    HEALING:
      "痛みを否定せず、回復に必要な時間と余白を認める言葉として読める",
    GRATITUDE:
      "困難を無視することなく、自分を支えるものに気づくための言葉として読める",
  },
};

const CATEGORY_NAMES = {
  en: {
    MINDFULNESS: "presence and awareness",
    WISDOM: "perspective and judgment",
    COURAGE: "courage and adversity",
    LOVE: "love and human connection",
    NATURE: "nature and the wider world",
    GROWTH: "learning and personal growth",
    HEALING: "healing and hope",
    GRATITUDE: "gratitude and appreciation",
  },
  "zh-Hans": {
    MINDFULNESS: "当下与觉察",
    WISDOM: "智慧与判断",
    COURAGE: "勇气与逆境",
    LOVE: "爱与关系",
    NATURE: "自然与世界",
    GROWTH: "学习与成长",
    HEALING: "疗愈与希望",
    GRATITUDE: "感恩与珍惜",
  },
  ja: {
    MINDFULNESS: "現在と気づき",
    WISDOM: "知恵と判断",
    COURAGE: "勇気と逆境",
    LOVE: "愛とつながり",
    NATURE: "自然と世界",
    GROWTH: "学びと成長",
    HEALING: "癒やしと希望",
    GRATITUDE: "感謝と大切にする心",
  },
};

function authorLens(role) {
  const normalized = role.toLowerCase();

  if (/scient|physic|research|mathem|学者|科学|研究/.test(normalized)) {
    return "observation, inquiry, and disciplined thinking";
  }
  if (/poet|writer|author|novelist|playwright|歌人|作家|诗人|作家/.test(normalized)) {
    return "language and imagination";
  }
  if (/philosoph|思想|哲学/.test(normalized)) {
    return "ideas, judgment, and the examined life";
  }
  if (/politic|president|minister|statesman|政治|首相|皇帝|王/.test(normalized)) {
    return "public choices, leadership, and responsibility";
  }
  if (/relig|monk|priest|theolog|僧|仏|宗教|牧师/.test(normalized)) {
    return "ethical and spiritual reflection";
  }
  if (/artist|paint|music|actor|director|艺术|画家|音楽|俳優/.test(normalized)) {
    return "creative practice and expression";
  }
  if (/athlete|coach|player|运动|選手|監督/.test(normalized)) {
    return "practice, resilience, and performance";
  }
  if (/activist|reformer|advocate|活動家|改革|社会运动/.test(normalized)) {
    return "social change and personal responsibility";
  }
  if (/business|entrepreneur|executive|経営|企业|商人/.test(normalized)) {
    return "action, leadership, and practical judgment";
  }

  return "the concerns suggested by the person’s recorded role";
}

function authorNote(author) {
  const lens = authorLens(author.known_role);

  if (author.language === "zh-Hans") {
    return `编辑视角：可先把${author.display_name}放在“${author.known_role}”这一身份线索中理解，关注其表达如何连接个人经验、时代处境与公共生活。这里提供的是阅读方向，不是完整传记；生平事实仍以核实状态和来源字段为准。`;
  }

  if (author.language === "ja") {
    return `編集者の視点：${author.display_name}は、まず「${author.known_role}」という現在の人物情報を手がかりに、その言葉が個人の経験、時代、社会とどう結びつくかを考えると読みやすい。これは読解の入口であり、伝記的事実そのものではない。`;
  }

  return `Editorial perspective: Read ${author.display_name} first through the cataloged role “${author.known_role},” with attention to ${lens}. This is a suggested way into the author’s words, not a substitute for a verified biography; factual claims remain governed by the source and verification fields.`;
}

function authorBiography(author, authorQuotes) {
  const categoryCounts = new Map();
  for (const quote of authorQuotes) {
    categoryCounts.set(
      quote.primary_category,
      (categoryCounts.get(quote.primary_category) ?? 0) + 1,
    );
  }
  const leadingCategories = [...categoryCounts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => CATEGORY_NAMES[author.language][category]);
  const sourceWorks = [
    ...new Set(
      authorQuotes
        .map((quote) => quote.source)
        .filter((source) => typeof source === "string" && source.trim()),
    ),
  ].slice(0, 3);

  if (author.language === "zh-Hans") {
    const themes =
      leadingCategories.length > 0
        ? leadingCategories.join("、")
        : "个人经验与生活选择";
    const works =
      sourceWorks.length > 0
        ? `目前收录内容还关联到《${sourceWorks.join("》《")}》等作品或出处。`
        : "";
    return `${author.display_name}在 ECHO 中被介绍为${author.known_role}。从当前收录的文字来看，其表达主要围绕${themes}展开，常以简洁的判断、经验性的观察或具有节奏感的语言，引导读者重新看待日常选择。${works}`;
  }

  if (author.language === "ja") {
    const themes =
      leadingCategories.length > 0
        ? leadingCategories.join("、")
        : "個人の経験と日々の選択";
    const works =
      sourceWorks.length > 0
        ? `現在の収録内容には『${sourceWorks.join("』『")}』などの作品・出典も含まれる。`
        : "";
    return `${author.display_name}は、ECHOでは${author.known_role}として紹介されている。収録された言葉からは、${themes}への関心が見え、短い表現の中に観察、判断、感情の動きを凝縮する語り方が特徴として感じられる。${works}`;
  }

  const themes =
    leadingCategories.length > 0
      ? leadingCategories.join(", ")
      : "personal experience and everyday choices";
  const works =
    sourceWorks.length > 0
      ? ` The current selection also points to works or sources including ${sourceWorks.join(", ")}.`
      : "";
  return `${author.display_name} is presented in ECHO as ${author.known_role}. Across the quotations selected for this catalog, the recurring concerns are ${themes}. The voice represented here tends to compress observation, judgment, or feeling into concise language that invites the reader to reconsider an ordinary choice or experience.${works}`;
}

function contextNote(context, quote) {
  const language = quote.language;
  const reading = CATEGORY_READINGS[language][quote.primary_category];
  const source = context.source_work;
  const normalizedText = quote.text.replace(/\s+/g, " ").trim();

  if (language === "zh-Hans") {
    const focus = normalizedText.slice(0, 18);
    const sourceLead = source
      ? `结合目前记录的《${source}》，`
      : "";
    return `${sourceLead}“${focus}${normalizedText.length > 18 ? "…" : ""}”这一表达可以被读作${reading}。它的力量在于没有给出复杂论证，而是把注意力集中到一个可以立即感受到的生活方向。`;
  }

  if (language === "ja") {
    const focus = normalizedText.slice(0, 20);
    const sourceLead = source
      ? `現在記録されている『${source}』を手がかりにすると、`
      : "";
    return `${sourceLead}「${focus}${normalizedText.length > 20 ? "…" : ""}」という表現は、${reading}。複雑な説明を重ねず、日々の中で実感できる一つの方向へ注意を向けさせるところに、この言葉の力がある。`;
  }

  const words = normalizedText.split(" ");
  const focus = words.slice(0, 10).join(" ");
  const sourceLead = source
    ? `Read alongside the currently recorded source, ${source}, the emphasis on “${focus}${words.length > 10 ? "…" : ""}” offers ${reading}.`
    : `The emphasis on “${focus}${words.length > 10 ? "…" : ""}” offers ${reading}.`;
  return `${sourceLead} Its force comes from narrowing a large idea into a direction the reader can recognize and apply in ordinary life.`;
}

for (const author of contextDocument.authors) {
  const authorQuotes = quotes.filter(
    (quote) =>
      quote.language === author.language &&
      quote.author_id === author.author_id,
  );
  author.biography = authorBiography(author, authorQuotes);
  author.biography_content_status = "editorial_profile";
  author.editorial_note = authorNote(author);
  author.editorial_note_kind = "interpretive_commentary";
}

for (const context of contextDocument.quote_contexts) {
  const quote = quotesById.get(String(context.quote_id));
  if (!quote) {
    throw new Error(`Missing quote for context ${String(context.quote_id)}`);
  }

  context.editorial_note = contextNote(context, quote);
  context.editorial_note_kind = "interpretive_commentary";
}

contextDocument.editorial_policy = [
  ...contextDocument.editorial_policy.filter(
    (entry) => !entry.startsWith("editorial_note"),
  ),
  "editorial_note 是基于文字、作者身份和分类的编辑解读，不是历史事实、作者原意或核实证据。",
  "事实状态只由 verification_status、content_status 和 sources 字段决定。",
];

fs.writeFileSync(
  contextsPath,
  `${JSON.stringify(contextDocument, null, 2)}\n`,
);

console.log(
  `Generated editorial notes for ${contextDocument.authors.length} authors and ${contextDocument.quote_contexts.length} quote contexts.`,
);
