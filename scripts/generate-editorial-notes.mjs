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
  CONTRIBUTION: ["the wish to make one’s effort useful to others", "让自己的力量真正对他人有用", "自分の力を誰かの役に立てたいという願い"],
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

const SITUATIONS = {
  ABUNDANCE: ["when having more still does not feel like enough", "拥有不少却仍觉得不够的时候", "多くを得てもまだ足りないと感じるとき"],
  ADVERSITY: ["after another plan has fallen apart", "计划再次落空之后", "また計画が崩れてしまったあと"],
  AMBITION: ["when a distant goal begins to demand a real sacrifice", "远方的目标开始要求真实付出的时候", "遠い目標のために現実の代償が必要になったとき"],
  ANIMALS: ["in a quiet encounter with a life unlike our own", "安静注视另一种生命的时候", "自分とは異なる命と静かに向き合うとき"],
  APPRECIATION: ["when the familiar is about to disappear", "熟悉的事物将要离开的时候", "慣れ親しんだものを失いそうなとき"],
  AWARENESS: ["in the breath before an impulsive reply", "一句冲动的话即将出口之前", "思わず言い返す直前の一呼吸"],
  BRAVERY: ["at the threshold of a choice that cannot be undone", "站在一个无法轻易回头的选择面前", "簡単には戻れない選択の前に立つとき"],
  CHANGE: ["when the old way no longer works but the new one is unclear", "旧办法已经失效、新方向却还模糊的时候", "古いやり方が通じず、新しい道も見えないとき"],
  COMPASSION: ["when someone’s pain has no quick solution", "面对一个无法立刻解决的痛苦时", "すぐには解決できない誰かの痛みに触れたとき"],
  CONTRIBUTION: ["when a younger person is wondering what their small effort can change", "一个年轻人正在怀疑自己的微小努力能改变什么时", "若い人が自分の小さな力で何を変えられるのか迷うとき"],
  CONTENTMENT: ["at the end of a day spent chasing the next thing", "追逐了一整天、终于停下来的夜晚", "次の何かを追い続けた一日の終わり"],
  COSMOS: ["under a night sky that makes ordinary worries feel small", "仰望夜空、日常烦恼忽然变小的时候", "夜空を見上げ、日々の悩みが小さく見えるとき"],
  CREATIVITY: ["before a blank page that offers no reassurance", "面对一张没有任何保证的白纸时", "何の保証もない白紙を前にしたとき"],
  DISCIPLINE: ["on an ordinary morning when motivation is absent", "毫无干劲却仍要开始的普通清晨", "やる気のない、ごく普通の朝"],
  FAMILY: ["after love and disappointment have appeared in the same home", "爱与失望同时出现在一个家里之后", "愛情と失望が同じ家に現れたあと"],
  FORGIVENESS: ["when an old injury keeps returning to the conversation", "旧日伤害一再回到谈话中的时候", "昔の傷が何度も会話に戻ってくるとき"],
  FRIENDSHIP: ["when distance or silence has tested a bond", "距离或沉默正在考验一段友谊时", "距離や沈黙が友情を試しているとき"],
  GRIEF: ["in a room made unfamiliar by someone’s absence", "一个房间因某人的缺席而变得陌生时", "誰かの不在で部屋が見知らぬ場所に思えるとき"],
  HOPE: ["when there is little evidence that tomorrow will improve", "看不见明天会变好的证据时", "明日が良くなる証拠をほとんど見つけられないとき"],
  HUMILITY: ["after certainty has been proved wrong", "笃定的判断被现实推翻之后", "確信していた判断が覆されたあと"],
  INNER_PEACE: ["while noise and expectation gather on every side", "四周的声音和期待同时压来时", "周囲の声や期待が一度に押し寄せるとき"],
  JOY: ["when a small delight arrives without being planned", "一份小小喜悦意外到来的时候", "思いがけない小さな喜びが訪れたとき"],
  JUDGMENT: ["when two reasonable choices pull in different directions", "两个都说得通的选择把人拉向不同方向时", "どちらにも理がある選択肢に引かれるとき"],
  LEADERSHIP: ["when other people must live with the result of one decision", "一个决定将由许多人共同承担后果时", "一つの決断の結果を多くの人が背負うとき"],
  LEARNING: ["after discovering that confidence exceeded understanding", "发现自信远远超过理解之后", "自信ほどには理解していなかったと気づいたあと"],
  MEDITATION: ["when the mind refuses to become quiet", "头脑无论如何都静不下来的时候", "どうしても心が静まらないとき"],
  OCEAN: ["at the shore, watching every mark be taken by the tide", "站在岸边看潮水带走所有痕迹时", "岸辺で波が跡を消していくのを見るとき"],
  PERSPECTIVE: ["after stepping away from a problem that once filled the whole view", "从一个曾占满视野的问题旁退开之后", "視界を塞いでいた問題から少し離れたあと"],
  PHILOSOPHY: ["when a routine life suddenly raises a very old question", "平常日子忽然冒出一个古老问题时", "いつもの暮らしから古い問いが突然現れたとき"],
  PRESENCE: ["while the body is here but the mind is already elsewhere", "身体在场、心却早已去了别处的时候", "体はここにあっても心が別の場所にいるとき"],
  RECOVERY: ["on a day when healing feels slower than expected", "恢复得比预想更慢的某一天", "回復が思ったより遅いと感じる日"],
  RESILIENCE: ["after being forced to begin again with less than before", "失去一些东西、不得不重新开始之后", "何かを失い、もう一度始めなければならないとき"],
  REST: ["when exhaustion is mistaken for a lack of character", "疲惫被误认为意志薄弱的时候", "疲れを意志の弱さだと思い込んでいるとき"],
  RISK: ["before certainty arrives, while the choice still matters", "答案尚未确定、选择却已迫在眉睫时", "確信はなくても選ばなければならないとき"],
  ROMANTIC_LOVE: ["when affection must survive beyond its first intensity", "最初的热烈退去、感情仍需继续时", "最初の高揚が去ったあとも愛情を育てるとき"],
  SEASONS: ["as a familiar landscape quietly changes its colors", "熟悉的景色悄悄换了颜色时", "見慣れた景色が静かに色を変えるころ"],
  SELF_KNOWLEDGE: ["when an unwanted truth about oneself becomes difficult to avoid", "一个不愿承认的自我真相再也无法回避时", "認めたくない自分の姿を避けられなくなったとき"],
  SELF_LOVE: ["when caring for oneself feels undeserved", "觉得自己不配被好好照顾的时候", "自分をいたわる資格がないように感じるとき"],
  STILLNESS: ["after the last task is finished and distraction falls away", "最后一件事做完、分心之物也散去之后", "最後の用事が終わり、気をそらすものがなくなったあと"],
  TRUTH: ["when honesty threatens a comfortable arrangement", "诚实可能打破安稳局面的时候", "正直さが居心地のよい関係を壊しかねないとき"],
  WILDERNESS: ["far from the places arranged for human convenience", "远离一切为人类便利而安排的地方时", "人の都合で整えられた場所を遠く離れたとき"],
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

function semanticSubcategory(quote) {
  const text = quote.text.toLowerCase();
  const overrides = [
    [/\bself[- ]care\b|自我照顾|自我照顧|自愛|セルフケア|自分をいたわ/, "SELF_LOVE"],
    [/\brest\b|\bsleep\b|休息|歇息|休む|眠り|休養/, "REST"],
    [/\bforgiv|\bpardon\b|宽恕|寬恕|原谅|原諒|許す|赦し/, "FORGIVENESS"],
    [/\bfriend|\bcompanionship\b|朋友|友谊|友誼|友情|友人/, "FRIENDSHIP"],
    [/\bfamily\b|\bmother\b|\bfather\b|\bchild\b|家庭|家人|父母|孩子|家族|母|父|子ども/, "FAMILY"],
    [/\bgrief\b|\bmourn|\bloss\b|悲痛|哀悼|失去|喪失|悲しみ/, "GRIEF"],
    [/\bserve\b|\bservice\b|\bcontribut|\bdevot|贡献|貢獻|奉献|奉獻|照明|人類.*事業|奉仕|捧げ/, "CONTRIBUTION"],
    [/\bcourage\b|\bbrave\b|\bfear\b|勇气|勇氣|恐惧|恐懼|勇気|恐れ/, "BRAVERY"],
    [/\blearn|\bstudy\b|\bknowledge\b|学习|學習|学问|學問|知识|知識|学ぶ|学問/, "LEARNING"],
    [/\btruth\b|\bhonest|\blie\b|真理|真实|真實|诚实|誠實|真実|正直/, "TRUTH"],
    [/\bchange\b|\bbecome\b|改变|改變|变化|變化|変わ|変化/, "CHANGE"],
    [/\bhope\b|\btomorrow\b|希望|明天|希望|明日/, "HOPE"],
  ];
  return overrides.find(([pattern]) => pattern.test(text))?.[1] ??
    quote.subcategory;
}

function capitalizeFirst(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function contextNote(_context, quote) {
  const language = quote.language;
  const text = quote.text.replace(/\s+/g, " ").trim();
  const focus = quoteFocus(text, language, String(quote.id));
  const languageIndex = language === "en" ? 0 : language === "zh-Hans" ? 1 : 2;
  const semanticCategory = semanticSubcategory(quote);
  const concept = CONCEPTS[semanticCategory]?.[
    languageIndex
  ] ?? CONCEPTS[quote.primary_category]?.[
    languageIndex
  ];
  const situation = SITUATIONS[semanticCategory]?.[languageIndex] ??
    SITUATIONS[quote.primary_category]?.[languageIndex];
  const openingSituation =
    language === "en" ? capitalizeFirst(situation) : situation;
  const variant = stableVariant(`${quote.id}:${quote.author_id}:${text}`, 12);

  if (language === "zh-Hans") {
    const readings = [
      `${situation}，人很容易只盯着眼前的难处。“${focus}”像一句从身旁传来的劝慰：先别急着否定自己，${concept}往往正从这一步开始。`,
      `把“${focus}”放进${situation}来读，会听见一种并不轻飘的温柔。${quote.author}似乎懂得，有些路无法替人走完，但一句真诚的话可以陪人撑过最犹疑的片刻。`,
      `也许有人正处在${situation}，既想往前，又怕付出的代价太大。此时“${focus}”不是命令，更像把混乱轻轻按住，让${concept}重新变得可见。`,
      `“${focus}”适合在${situation}慢慢读。它没有假装事情很容易，只是承认人的软弱之后，仍愿意相信${concept}可以带来一点转机。`,
      `有些话是在顺境里听不进去的。等到${situation}，“${focus}”才会显出分量：它关心的不是漂亮答案，而是一个人怎样守住${concept}。`,
      `${quote.author}的这番话，像是说给那个在${situation}仍不肯敷衍自己的人。“${focus}”所珍惜的，是${concept}背后那份不声张的认真。`,
      `想象一次发生在${situation}的谈话。对面的人可能已经疲惫，不需要大道理；“${focus}”恰好把${concept}说得朴素，也说得有人情味。`,
      `人到了${situation}，常会怀疑过去的坚持是否还有意义。“${focus}”没有替现实涂上亮色，却让${concept}成为一件仍可握住的东西。`,
      `这更像一句经历过生活的人才会说的话：“${focus}”。在${situation}，真正难的从来不是懂得道理，而是仍愿意为${concept}付出耐心。`,
      `若在${situation}听见“${focus}”，它大概不会显得高高在上。那语气更接近陪伴——知道局面未必马上改变，却不愿让人丢掉${concept}。`,
      `“${focus}”背后仿佛站着一个见过得失的人。面对${situation}，他没有催促谁立刻振作，只把${concept}当作一盏不太耀眼、却足够可靠的灯。`,
      `或许这番话原本就是为${situation}准备的。“${focus}”容纳了迟疑、疲惫和不甘，最后落到${concept}，因而显得真实而不空泛。`,
    ];
    return readings[variant];
  }

  if (language === "ja") {
    const readings = [
      `${situation}、人は目の前の苦しさだけで自分を判断しがちだ。「${focus}」は、そんなとき隣から届く静かな声に聞こえる。${concept}は、案外この小さな一歩から始まるのかもしれない。`,
      `「${focus}」を${situation}に置いてみると、軽くはない優しさが伝わってくる。道を代わりに歩くことはできなくても、ためらう時間を一緒に支える言葉はある。`,
      `${situation}、進みたい気持ちと失う怖さは同時にやってくる。「${focus}」は答えを急がせず、見失いかけた${concept}をもう一度そっと示しているようだ。`,
      `「${focus}」は、${situation}にゆっくり読みたい。難しさを小さく見せるのではなく、弱さを抱えたままでも${concept}へ向かえると信じる響きがある。`,
      `順調なときには通り過ぎてしまう言葉がある。${situation}、「${focus}」は急に重みを持つ。きれいな答えより、どう${concept}を守るかが問われている。`,
      `${quote.author}の言葉は、${situation}にも自分をごまかさない人へ向けられているように感じる。「${focus}」が大切にしているのは、${concept}を支える目立たない誠実さだ。`,
      `${situation}に交わされる会話を思い浮かべたい。疲れた相手に必要なのは大げさな教訓ではない。「${focus}」は${concept}を素朴に、温かく差し出している。`,
      `人は${situation}、これまでの努力に意味があったのか疑いたくなる。「${focus}」は現実を明るく塗り替えない。それでも${concept}だけは手放さずに済む。`,
      `これは生活をくぐってきた人の声に近い。「${focus}」。${situation}、難しいのは正しさを知ることではなく、${concept}のためにもう少し辛抱することなのだろう。`,
      `${situation}に「${focus}」と声をかけられたなら、上からの教訓には聞こえないはずだ。すぐには変わらない現実を知りながら、${concept}を失わせまいとする言葉だからだ。`,
      `「${focus}」の背後には、得ることも失うことも知る人の姿が見える。${situation}、無理に立ち直れとは言わず、${concept}を小さな灯のように置いている。`,
      `この言葉は、もしかすると${situation}のためにあるのかもしれない。「${focus}」は迷いも疲れも悔しさも受け止め、最後に${concept}へ戻ってくる。`,
    ];
    return readings[variant];
  }

  const readings = [
    `${openingSituation}, it is easy to judge a whole life by the difficulty directly ahead. “${focus}” sounds like a steady voice nearby: do not dismiss yourself too quickly; ${concept} may begin with this one step.`,
    `Set “${focus}” beside ${situation}, and its tenderness no longer feels weightless. No one can walk another person’s road, but an honest voice can keep someone company through the most uncertain part.`,
    `Someone facing ${situation} may want to move and fear the cost at the same time. “${focus}” does not issue an order. It quiets the panic long enough for ${concept} to come back into sight.`,
    `“${focus}” is worth hearing slowly during ${situation}. It never pretends the trouble is simple; it trusts that a person can carry weakness and still move toward ${concept}.`,
    `Some words barely register in easy times. During ${situation}, “${focus}” acquires weight. The concern is not a polished answer, but how a person protects ${concept} when doing so becomes difficult.`,
    `${quote.author} seems to be speaking to someone who refuses to become careless during ${situation}. What “${focus}” values is the quiet seriousness beneath ${concept}, the part that rarely earns applause.`,
    `Imagine a conversation during ${situation}. The tired person across the table does not need a grand lesson. “${focus}” offers ${concept} plainly, with the warmth of someone willing to stay.`,
    `During ${situation}, people often wonder whether their earlier effort meant anything. “${focus}” does not brighten the facts, but it makes ${concept} feel like something that can still be held.`,
    `This sounds less like a maxim than something said by a person who has been tested: “${focus}.” During ${situation}, the hard part is not knowing the principle; it is remaining patient with ${concept}.`,
    `Heard during ${situation}, “${focus}” would not feel like advice from above. It feels more like companionship—aware that circumstances may not change soon, yet unwilling to let ${concept} disappear.`,
    `Behind “${focus}” one can almost see someone acquainted with both gain and loss. During ${situation}, there is no demand to recover at once; ${concept} is simply set down like a modest, dependable lamp.`,
    `Perhaps these words belong especially to ${situation}. “${focus}” accepts hesitation, fatigue, and disappointment before returning to ${concept}, which is why it feels lived rather than ornamental.`,
  ];
  return readings[variant];
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
  "editorial_note 是从名言涉及的人生处境与情感经验出发的编辑解读，不代表作者原意或史实判断。",
  "事实状态只由 verification_status、content_status 和 sources 字段决定。",
];

fs.writeFileSync(contextsPath, `${JSON.stringify(contextDocument, null, 2)}\n`);
console.log(
  `Generated factual profiles for ${contextDocument.authors.length} authors and distinct readings for ${contextDocument.quote_contexts.length} quotes.`,
);
