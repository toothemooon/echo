import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contextsPath = path.join(root, "QUOTE_CONTEXTS.json");
const contextDocument = JSON.parse(fs.readFileSync(contextsPath, "utf8"));
const quotes = [
  ...JSON.parse(fs.readFileSync(path.join(root, "assets/quotes.json"), "utf8")),
  ...JSON.parse(
    fs.readFileSync(path.join(root, "assets/quotes.zh-Hans.json"), "utf8"),
  ),
  ...JSON.parse(
    fs.readFileSync(path.join(root, "assets/quotes.ja.json"), "utf8"),
  ),
];
const quotesById = new Map(quotes.map((quote) => [String(quote.id), quote]));

// CBDB numbers are research identifiers, not reader-facing occupations.
const ROLE_CORRECTIONS = {
  zh_wikiquote_9482: "北宋诗人、学者，《神童诗》传为其作",
  zh_wikiquote_9573: "清初诗人、学者（1618—1677）",
  zh_wikiquote_9576: "明代官员、思想家，王阳明弟子（1491—1562）",
  zh_wikiquote_16244: "金末文学家、史学家，《归潜志》作者（1203—1250）",
  zh_wikiquote_21369: "清代学者、作家，《西岩赘语》作者",
  zh_wikiquote_21423: "晚清民国词人、词学家（1859—1926）",
  zh_wikiquote_21710: "南宋思想家、文学家，永康学派代表人物（1143—1194）",
};

const FACTUAL_BIOGRAPHIES = {
  "zh-Hans:zh_marcus-aurelius":
    "马可·奥勒留（121—180）是罗马帝国皇帝，也是斯多葛主义哲学传统的重要人物。他在位期间经历边境战争、瘟疫与宫廷叛乱；后世以《沉思录》之名整理的私人笔记，记录了他对责任、自律和死亡的反复思考。",
  "en:aristotle":
    "Aristotle (384–322 BCE) was a Greek philosopher born in Stagira. He studied in Plato’s Academy, later tutored Alexander of Macedon, and founded the Lyceum in Athens. His surviving works range across logic, ethics, politics, rhetoric, poetics, biology, and metaphysics.",
  "ja:ja_wikiquote_4589":
    "池田勇人（1899–1965）は大蔵官僚出身の政治家。通商産業大臣、大蔵大臣を経て、1960年から1964年まで第58・59・60代内閣総理大臣を務めた。所得倍増計画を掲げた政権運営で知られる。",
  "zh-Hans:zh_wikiquote_29767":
    "刘伟是中国游戏企业米哈游的联合创始人之一，并担任公司总裁。他毕业于上海交通大学，与蔡浩宇、罗宇皓共同创业；米哈游此后开发了《崩坏》系列、《原神》等游戏作品。",
  "en:brene_brown":
    "Brené Brown is an American researcher, professor, and author whose work focuses on courage, vulnerability, shame, and empathy. She has taught and conducted research at the University of Houston and is known internationally through books and public lectures.",
  "ja:ja_wikiquote_2921":
    "太田水穂（1876–1955）は長野県出身の歌人・国文学者。本名は太田貞一。短歌雑誌『潮音』を創刊し、古典研究と作歌の両面で活動した。歌人の四賀光子は妻、太田青丘は養子にあたる。",
  "ja:ja_wikiquote_1431":
    "徳川家康（1543–1616）は戦国時代から江戸時代初期の武将。関ヶ原の戦いで主導権を確立し、1603年に征夷大将軍となって江戸幕府を開いた。大坂の陣を経て徳川政権の基盤を固めた。",
  "ja:ja_wikiquote_4260":
    "新庄剛志（1972–）は長崎県生まれ、福岡県育ちの元プロ野球選手・監督。阪神タイガース、ニューヨーク・メッツなどを経て北海道日本ハムファイターズでプレーし、2006年に現役を引退。2022年から同球団の監督を務める。",
};

const CONCEPTS = {
  ABUNDANCE: ["what is already sufficient", "已经拥有的丰足", "すでにある豊かさ"],
  ADVERSITY: ["the response to hardship", "面对困境时的选择", "逆境への向き合い方"],
  AMBITION: ["the direction of ambition", "志向与行动的方向", "志と行動の方向"],
  ANIMALS: ["human kinship with other lives", "人与其他生命的关系", "人とほかの生命との関係"],
  APPRECIATION: ["the practice of noticing value", "发现价值的能力", "価値に気づく姿勢"],
  AWARENESS: ["attention before reaction", "反应之前的觉察", "反応に先立つ気づき"],
  BRAVERY: ["action in the presence of fear", "恐惧仍在时的行动", "恐れがある中での行動"],
  CHANGE: ["the tension between continuity and change", "延续与改变之间的张力", "持続と変化の緊張"],
  COMPASSION: ["care expressed through conduct", "落实为行动的体恤", "行動として表れる思いやり"],
  CONTENTMENT: ["the boundary between enough and more", "知足与欲望的边界", "足ることと欲望の境目"],
  COSMOS: ["the scale of human life within the universe", "人在宇宙尺度中的位置", "宇宙の尺度における人の位置"],
  CREATIVITY: ["making something that did not exist before", "从无到有的创造过程", "まだないものを形にする営み"],
  DISCIPLINE: ["the accumulated effect of repeated choices", "重复选择所形成的力量", "選択の反復が生む力"],
  FAMILY: ["the obligations and intimacy of family", "家庭中的亲密与责任", "家族の親密さと責任"],
  FORGIVENESS: ["release without erasing memory", "不抹去记忆的释怀", "記憶を消さずに手放すこと"],
  FRIENDSHIP: ["trust sustained between equals", "平等关系中维系的信任", "対等な関係に育つ信頼"],
  GRIEF: ["living with an absence that remains", "与持续存在的缺席共处", "残り続ける不在と生きること"],
  HOPE: ["possibility kept open under pressure", "压力之下仍被保留的可能", "苦境でも閉ざさない可能性"],
  HUMILITY: ["clear sight without self-inflation", "不夸大自我的清醒", "自分を誇張しない明晰さ"],
  INNER_PEACE: ["steadiness independent of noise", "不被外界喧扰支配的安定", "外の騒がしさに左右されない安定"],
  JOY: ["the recognition of lived delight", "对真实喜悦的辨认", "生の喜びを見つけること"],
  JUDGMENT: ["the standards behind a decision", "判断背后的尺度", "判断を支える基準"],
  LEADERSHIP: ["responsibility for consequences shared by others", "对共同后果承担责任", "他者と共有する結果への責任"],
  LEARNING: ["the revision of what one thinks one knows", "对既有认识的修正", "知っているつもりを改めること"],
  MEDITATION: ["attention trained through stillness", "在静定中训练的注意力", "静けさの中で鍛える注意"],
  OCEAN: ["vastness, movement, and human limits", "辽阔、流动与人的限度", "広がり、動き、人の限界"],
  PERSPECTIVE: ["how distance changes judgment", "距离如何改变判断", "距離が判断を変える仕方"],
  PHILOSOPHY: ["the assumptions beneath ordinary life", "日常生活背后的根本假设", "日常の下にある前提"],
  PRESENCE: ["full attention to the moment at hand", "对眼前时刻的完整注意", "目の前の時への十分な注意"],
  RECOVERY: ["the uneven work of becoming whole again", "重新恢复完整的曲折过程", "再び自分を取り戻す道のり"],
  RESILIENCE: ["adaptation without surrender", "不放弃之中的调整能力", "諦めずに適応する力"],
  REST: ["rest as a condition for continuing", "休息作为继续前行的条件", "進み続けるための休息"],
  RISK: ["commitment before certainty", "确定性到来之前的投入", "確実になる前の決断"],
  ROMANTIC_LOVE: ["intimacy, desire, and mutual recognition", "亲密、渴望与彼此看见", "親密さ、願い、互いを認めること"],
  SEASONS: ["change understood through natural cycles", "从自然循环中理解变化", "自然の循環から知る変化"],
  SELF_KNOWLEDGE: ["the difficult accuracy of seeing oneself", "如实看见自己的困难", "自分を正確に見る難しさ"],
  SELF_LOVE: ["care for oneself without self-deception", "不自欺的自我关照", "自己欺瞞に陥らない自己への配慮"],
  STILLNESS: ["what becomes audible when activity stops", "行动停下后才显现的内容", "動きを止めて初めて聞こえるもの"],
  TRUTH: ["the cost and clarity of facing what is so", "面对事实所需的代价与清醒", "事実に向き合う明晰さと代償"],
  WILDERNESS: ["life beyond human control", "人类控制之外的生命世界", "人の制御を超えた生命世界"],
};

function stableVariant(value, count) {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.codePointAt(0)) >>> 0;
  }
  return hash % count;
}

function shortRole(role, language) {
  const cleaned = role
    .replace(/\s+/g, " ")
    .replace(/\s*CBDB\s*[=(]?\s*\d+\)?/gi, "")
    .replace(/[。.；;]+\s*$/, "")
    .trim();
  return language === "en" ? cleaned : cleaned.split(/[。]/, 1)[0].trim();
}

function englishRolePhrase(role) {
  const value = shortRole(role, "en");
  const lower = value.charAt(0).toLowerCase() + value.slice(1);
  return `${/^[aeiou]/i.test(lower) ? "an" : "a"} ${lower}`;
}

function usefulSources(authorQuotes) {
  return [
    ...new Set(
      authorQuotes
        .map((quote) =>
          quote.source
            ?.trim()
            .replace(/^[《『「“"]+|[》』」”"]+$/g, ""),
        )
        .filter(
          (source) =>
            source &&
            !/^(external links?|外部リンク|外部链接|リンク|website|web|unknown|不详|不詳)$/i.test(
              source,
            ) &&
            !/^https?:/i.test(source) &&
            !/^\d+$/.test(source),
        ),
    ),
  ].slice(0, 3);
}

function sourceKind(role) {
  const value = role.toLowerCase();
  if (/poet|writer|author|novelist|playwright|philosoph|歌人|作家|诗人|詩人|哲学|思想/.test(value)) return "works";
  if (/politic|president|minister|statesman|政治|首相|大臣|皇帝|官员|官僚/.test(value)) return "public";
  if (/athlete|coach|player|baseball|football|sport|選手|指導者|野球|运动/.test(value)) return "career";
  return "records";
}

function authorBiography(author, authorQuotes) {
  if (FACTUAL_BIOGRAPHIES[author.author_ref]) {
    return FACTUAL_BIOGRAPHIES[author.author_ref];
  }
  const role = shortRole(author.known_role, author.language);
  const sources = usefulSources(authorQuotes);
  const kind = sourceKind(role);
  if (author.language === "zh-Hans") {
    const base = `${author.display_name}，${role}。`;
    if (!sources.length) return base;
    if (kind === "works") return `${base}现有条目涉及的作品包括《${sources.join("》《")}》。`;
    if (kind === "public") return `${base}现有资料收录了${sources.join("、")}等公开讲话或活动记录。`;
    if (kind === "career") return `${base}${sources.join("、")}等记录反映了其职业经历。`;
    return `${base}相关资料包括${sources.join("、")}。`;
  }
  if (author.language === "ja") {
    const base = `${author.display_name}は${role}。`;
    if (!sources.length) return base;
    if (kind === "works") return `${base}関連作品には『${sources.join("』『")}』がある。`;
    if (kind === "public") return `${base}「${sources.join("」「")}」などの演説・活動記録が残る。`;
    if (kind === "career") return `${base}「${sources.join("」「")}」などの記録は、その職歴に関わる。`;
    return `${base}関連資料には「${sources.join("」「")}」がある。`;
  }
  const base = `${author.display_name} is ${englishRolePhrase(role)}.`;
  if (!sources.length) return base;
  if (kind === "works") return `${base} Works or texts represented here include ${sources.join(", ")}.`;
  if (kind === "public") return `${base} The record represented here includes ${sources.join(", ")}.`;
  if (kind === "career") return `${base} Career records represented here include ${sources.join(", ")}.`;
  return `${base} Related records include ${sources.join(", ")}.`;
}

function authorNote(author) {
  const role = shortRole(author.known_role, author.language);
  if (author.language === "zh-Hans") return `${author.display_name}的资料页以其生平身份、相关作品和当前名言为阅读线索。`;
  if (author.language === "ja") return `${author.display_name}の人物情報を、経歴、関連作品、現在の言葉からたどる。`;
  return `This profile follows ${author.display_name} through biographical facts, related works, and the selected quotation.`;
}

function quoteFocus(text, language, seed) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (language === "en") {
    const words = normalized.split(" ");
    if (words.length <= 12) return normalized;
    return `${words.slice(0, 8).join(" ")}…${words.slice(-4).join(" ")}`;
  }
  if (normalized.length <= 24) return normalized;
  return `${normalized.slice(0, 16)}…${normalized.slice(-6)}`;
}

function sentenceShape(text, language) {
  if (/[?？]/.test(text)) return "question";
  if (
    language === "en"
      ? /\b(not|never|but|rather than|instead of)\b/i.test(text)
      : language === "zh-Hans"
        ? /不是|不在|而是|却|但|莫|勿/.test(text)
        : /ではなく|しかし|だが|よりも|ない/.test(text)
  ) return "contrast";
  if (
    language === "en"
      ? /\b(if|when|unless|until)\b/i.test(text)
      : language === "zh-Hans"
        ? /若|如果|只要|当|则|便/.test(text)
        : /なら|れば|とき|時|まで/.test(text)
  ) return "condition";
  if (/[;；:：]/.test(text) || (text.match(/[,，、]/g)?.length ?? 0) >= 2) return "parallel";
  return "statement";
}

function contextNote(context, quote) {
  const language = quote.language;
  const text = quote.text.replace(/\s+/g, " ").trim();
  const focus = quoteFocus(text, language, String(quote.id));
  const shape = sentenceShape(text, language);
  const concept = CONCEPTS[quote.subcategory]?.[
    language === "en" ? 0 : language === "zh-Hans" ? 1 : 2
  ] ?? CONCEPTS[quote.primary_category]?.[
    language === "en" ? 0 : language === "zh-Hans" ? 1 : 2
  ];
  const variant = stableVariant(`${quote.id}:${text}`, 4);

  if (language === "zh-Hans") {
    const openings = {
      question: `“${focus}”以问句打开思考，没有急于替读者作答。`,
      contrast: `“${focus}”通过否定与转折划出界线，把容易混淆的两种态度分开。`,
      condition: `“${focus}”把结果放进条件关系中，强调选择与后果并非彼此孤立。`,
      parallel: `“${focus}”借助并列和节奏推进观点，使几个层次彼此映照。`,
      statement: `“${focus}”采用直接判断的口吻，把一个较大的问题压缩成清晰立场。`,
    };
    const endings = [
      `这里真正被强调的是${concept}，而不是一句脱离行动的口号。`,
      `阅读重点可以放在${concept}：句子要求人重新衡量自己正在坚持的标准。`,
      `它把${concept}置于句子中心，也给读者留下联系自身经验的余地。`,
      `从这个角度看，句意落在${concept}，其价值在于改变观察问题的起点。`,
    ];
    return `${openings[shape]}${endings[variant]}`;
  }

  if (language === "ja") {
    const openings = {
      question: `「${focus}」は問いの形で思考を開き、答えを読者に委ねている。`,
      contrast: `「${focus}」は否定と対比によって境界を引き、混同しやすい二つの態度を分けている。`,
      condition: `「${focus}」は条件と結果を結び、選択がその後に及ぼす働きを示している。`,
      parallel: `「${focus}」は並列とリズムを用い、複数の要素を照らし合わせている。`,
      statement: `「${focus}」は断定的な言い方で、大きな問題を一つの明確な立場へ絞っている。`,
    };
    const endings = [
      `中心にあるのは${concept}であり、行動から切り離された標語ではない。`,
      `${concept}という観点から読むと、自分が頼りにしている基準を問い直す言葉になる。`,
      `この一文は${concept}に焦点を置きながら、個々の経験を重ねる余白も残している。`,
      `ここでは${concept}が出発点となり、ものの見方そのものを少しずらしている。`,
    ];
    return `${openings[shape]}${endings[variant]}`;
  }

  const openings = {
    question: `By asking “${focus},” the line opens a problem instead of supplying a ready answer.`,
    contrast: `The contrast in “${focus}” separates two attitudes that are easy to confuse.`,
    condition: `The conditional movement of “${focus}” links a choice to what follows from it.`,
    parallel: `The parallel movement of “${focus}” lets several ideas sharpen one another.`,
    statement: `The direct claim in “${focus}” compresses a large subject into a definite position.`,
  };
  const endings = [
    `Its center of gravity is ${concept}, not a slogan detached from conduct.`,
    `Read through ${concept}, the line asks the reader to reconsider the standard guiding a choice.`,
    `The sentence keeps ${concept} in view while leaving room for the reader’s own experience.`,
    `Seen this way, ${concept} becomes a new starting point for judging the situation.`,
  ];
  return `${openings[shape]} ${endings[variant]}`;
}

for (const author of contextDocument.authors) {
  if (ROLE_CORRECTIONS[author.author_id]) {
    author.known_role = ROLE_CORRECTIONS[author.author_id];
  }
  const authorQuotes = quotes.filter(
    (quote) =>
      quote.language === author.language && quote.author_id === author.author_id,
  );
  author.biography = authorBiography(author, authorQuotes);
  author.biography_content_status = "editorial_profile";
  author.editorial_note = authorNote(author);
  author.editorial_note_kind = "interpretive_commentary";
}

for (const context of contextDocument.quote_contexts) {
  const quote = quotesById.get(String(context.quote_id));
  if (!quote) throw new Error(`Missing quote for context ${String(context.quote_id)}`);
  context.editorial_note = contextNote(context, quote);
  context.editorial_note_kind = "interpretive_commentary";
}

contextDocument.editorial_policy = [
  ...contextDocument.editorial_policy.filter(
    (entry) => !entry.startsWith("editorial_note"),
  ),
  "editorial_note 是基于名言用词、句式和主题的编辑解读，不代表作者原意或史实判断。",
  "事实状态只由 verification_status、content_status 和 sources 字段决定。",
];

fs.writeFileSync(contextsPath, `${JSON.stringify(contextDocument, null, 2)}\n`);
console.log(
  `Generated factual profiles for ${contextDocument.authors.length} authors and distinct readings for ${contextDocument.quote_contexts.length} quotes.`,
);
