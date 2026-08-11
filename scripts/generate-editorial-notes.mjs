import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanWorkTitle } from "./wikiquote-support.mjs";

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

// Written by scripts/fetch-author-biographies.mjs. Absent on a fresh checkout,
// in which case authors fall back to catalog identity only.
const biographyCachePath = path.join(root, "data/author-biographies.json");
const biographyDocument = fs.existsSync(biographyCachePath)
  ? JSON.parse(fs.readFileSync(biographyCachePath, "utf8"))
  : {};
const biographyCache = biographyDocument.biographies ?? {};
const workCache = biographyDocument.works ?? {};

const WIKIPEDIA_HOSTS = {
  en: "en.wikipedia.org",
  ja: "ja.wikipedia.org",
  "zh-Hans": "zh.wikipedia.org",
};

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

function shortRole(role, language) {
  const cleaned = role
    .replace(/\s+/g, " ")
    .replace(/\s*CBDB\s*[=(]?\s*\d+\)?/gi, "")
    .replace(/[。.；;]+\s*$/, "")
    .trim();
  return language === "en" ? cleaned : cleaned.split(/[。]/, 1)[0].trim();
}

// Split on sentence boundaries only. The previous generation truncated by
// character count, which cut words in half; nothing here may do that.
function splitSentences(text, language) {
  if (language === "en") {
    return text
      .split(/(?<=[.!?])\s+(?=[A-Z"“'(])/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
  }
  return (text.match(/[^。！？]*[。！？]|[^。！？]+$/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

// Wikipedia leads carry pronunciation glosses, IPA and stray reference debris
// that read as noise in a profile card.
function cleanExtract(text) {
  return text
    .replace(/ /g, " ")
    .replace(/\[\d+\]/g, "")
    .replace(/\s*\([^)]*(?:pronunciation|IPA|listen|help·info)[^)]*\)/gi, "")
    // Stripping IPA out of a plain-text extract leaves "Hamlet ()" behind.
    .replace(/\s*[(（]\s*[)）]/g, "")
    .replace(/\s+([,，、。;；:：!！?？])/g, "$1")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// Keep whole sentences up to a comfortable card length. English is far less
// dense per character than Chinese or Japanese, so the budgets differ.
function trimToLength(text, language) {
  const budget = language === "en" ? 340 : 150;
  const sentences = splitSentences(text, language);
  if (!sentences.length) return "";

  let output = sentences[0];
  for (const sentence of sentences.slice(1)) {
    const joined = language === "en" ? `${output} ${sentence}` : output + sentence;
    if (joined.length > budget) break;
    output = joined;
  }
  return output;
}

// Wikipedia leads open by restating the article title, and the profile screen
// already shows the name as its heading plus the role line beneath it. Drop the
// opening name — and the naming/pronunciation parenthetical that trails it —
// so the section starts on the first thing the reader does not already know.
function stripLeadingName(paragraph, author) {
  const cached = biographyCache[author.author_ref];
  const names = [
    author.display_name,
    cached?.title,
    ...Object.values(cached?.names ?? {}),
  ]
    .filter(Boolean)
    .map((value) => value.trim())
    .filter(Boolean)
    // Longest first so "伊曼努尔·康德" wins over a bare surname.
    .sort((left, right) => right.length - left.length);

  for (const name of names) {
    // Japanese articles space out personal names ("小泉 純一郎") while the
    // catalog stores them closed up, so allow whitespace between characters.
    const pattern = new RegExp(
      `^${[...name]
        .map((character) => character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("\\s*")}`,
    );
    const matched = pattern.exec(paragraph);
    if (!matched) continue;

    let rest = paragraph.slice(matched[0].length).trimStart();
    // A parenthetical straight after the name holds alternate spellings, the
    // original-language form and dates: all already covered by the role line.
    rest = rest.replace(/^[（(][^）)]*[）)]/, "").trimStart();
    rest = rest.replace(/^[，,、:：;；—–-]+\s*/, "").trimStart();
    // Chinese and Japanese leads often continue "…は、" or "…，是".
    rest = rest.replace(/^(?:是|為|为|は|が)\s*/, "").trimStart();
    // English leads read "<name> was an English playwright". Dropping only the
    // name would leave "Was an English playwright"; drop the verb too so the
    // section opens as a noun phrase.
    rest = rest.replace(/^(?:was|is|were|are)\s+/i, "");
    // Stripping "は" can expose the comma that followed it.
    rest = rest.replace(/^[，,、:：;；]+\s*/, "").trimStart();

    // Too little left to be worth a section of its own — the role line already
    // carries it. Signal "nothing to say" rather than falling back to the
    // paragraph, which would put the name back at the top.
    return rest.length >= 12
      ? rest.charAt(0).toUpperCase() + rest.slice(1)
      : null;
  }
  return paragraph;
}

// A common name resolves to a disambiguation page rather than a person, and
// its lead ("Drake may refer to:") is not a biography of anyone.
const DISAMBIGUATION =
  /(?:may|can) refer to|is the name of|may also refer to|的名字可以指|可以指[：:]|是下列人物|以下の人物|曖昧さ回避|につい(?:て|ての)一覧/i;

function wikipediaBiography(author) {
  const cached = biographyCache[author.author_ref];
  if (!cached?.extract) return null;
  if (DISAMBIGUATION.test(cached.extract.slice(0, 120))) return null;

  // The lead's first paragraph is the definitional one; later paragraphs drift
  // into career detail that does not belong on a quote card.
  const paragraph = cleanExtract(cached.extract)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)[0];
  if (!paragraph) return null;

  const stripped = stripLeadingName(paragraph, author);
  // Nothing survived beyond the name: whatever the article says is already in
  // the role line above, so leave the section out rather than repeat it.
  if (!stripped) return null;

  const biography = trimToLength(stripped, author.language);
  if (!biography) return null;

  return {
    biography,
    source: {
      title: cached.title,
      url: `https://${WIKIPEDIA_HOSTS[author.language]}/wiki/${encodeURIComponent(
        cached.title.replace(/ /g, "_"),
      )}`,
      note: "Wikipedia, CC BY-SA 4.0",
    },
  };
}

// ---------------------------------------------------------------------------
// Historical echo
//
// Describes the world a speaker lived in: era, place, calling, intellectual
// current, and what the text it appears in actually is. Every clause restates
// a fetched fact. Nothing here may claim the occasion of the quotation — no
// catalog record has a verified one, so asserting it would invent history.
// ---------------------------------------------------------------------------

// Wikidata times look like "+1564-04-23T00:00:00Z" or "-0650-00-00T00:00:00Z".
function parseYear(time) {
  const match = /^([+-])(\d{4})/.exec(String(time ?? ""));
  if (!match) return null;
  const year = Number(match[2]);
  if (!year) return null;
  return match[1] === "-" ? -year : year;
}

function centuryOf(year) {
  return year < 0 ? Math.ceil(-year / 100) : Math.ceil(year / 100);
}

function eraPhrase(facts, language) {
  const born = parseYear(facts.born);
  const died = parseYear(facts.died);
  if (born === null && died === null) return null;

  const anchor = born ?? died;
  const bce = anchor < 0;
  // Centuries must run in chronological order, which for BC counts *down*:
  // Thales (-650 to -548) spans the 7th to the 6th century BC, not 6th to 7th.
  const first = centuryOf(anchor);
  const last = died !== null ? centuryOf(died) : first;
  const span = first === last ? `${first}` : `${first}—${last}`;

  if (language === "zh-Hans") return bce ? `公元前${span}世纪` : `${span}世纪`;
  if (language === "ja") return bce ? `紀元前${span}世紀` : `${span}世紀`;

  const ordinal = (value) => {
    const remainder = value % 100;
    if (remainder >= 11 && remainder <= 13) return `${value}th`;
    return `${value}${["th", "st", "nd", "rd"][value % 10] ?? "th"}`;
  };
  const range =
    first === last
      ? ordinal(first)
      : `${ordinal(first)}–${ordinal(last)}`;
  return bce ? `${range}-century BC` : `${range}-century`;
}

function lifeYears(facts, language) {
  const born = parseYear(facts.born);
  const died = parseYear(facts.died);
  if (born === null && died === null) return null;
  const mark = (year) => {
    if (year === null) return "";
    if (year >= 0) return String(year);
    return language === "en" ? `${-year} BC` : `前${-year}`;
  };
  if (born !== null && died !== null) return `${mark(born)}–${mark(died)}`;
  if (born !== null) {
    return language === "en" ? `born ${mark(born)}` : `${mark(born)}—`;
  }
  return language === "en" ? `died ${mark(died)}` : `—${mark(died)}`;
}

// No cross-language fallback: an English label dropped into Chinese or
// Japanese prose reads as a bug ("是哲学家、epigrammatist"). Better to omit it.
function labelFor(entry, language) {
  if (!entry) return null;
  if (language === "zh-Hans") return entry["zh-hans"] ?? entry.zh ?? null;
  if (language === "ja") return entry.ja ?? null;
  return entry.en ?? null;
}

const HAS_CJK = /[぀-ヿ㐀-䶿一-鿿]/;

// `requireCjk` is for descriptive terms — occupation, position, movement,
// field. Some Wikidata items hold English text in the zh/ja label field, which
// surfaces as "曾任Member of the 1689-90 Parliament". Titles of works are
// exempt: those are routinely cited in their original language.
function labelList(entries, language, limit = 2, requireCjk = false) {
  const labels = [
    ...new Set(
      (entries ?? [])
        .map((entry) => labelFor(entry, language))
        .filter(Boolean)
        .filter(
          (label) =>
            !requireCjk || language === "en" || HAS_CJK.test(label),
        ),
    ),
  ].slice(0, limit);
  if (!labels.length) return null;
  if (language !== "en") return labels.join("、");
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}

// "statelessness" and similar are legal states, not places a reader can picture.
const NON_PLACE = /statelessness|无国籍|無国籍|unknown|不明/i;

function placePhrase(facts, language) {
  const birthplace = labelList(facts.birthplace, language, 1);
  if (birthplace && !NON_PLACE.test(birthplace)) return birthplace;
  const country = (facts.country ?? [])
    .map((entry) => labelFor(entry, language))
    .filter((label) => label && !NON_PLACE.test(label))[0];
  return country ?? null;
}

// A generic-sounding source title happily matches an unrelated article: "原文"
// resolved to the translation-studies concept "source text", and 『海潮音』 to a
// Buddhist term rather than the poetry anthology. A real work's lead almost
// always names its author, so require that before trusting the match — a wrong
// description is worse than none.
function mentionsAuthor(extract, author) {
  const cached = biographyCache[author.author_ref];
  // Match against every known form of the name. zh.wikipedia serves Simplified
  // here while a display name such as 司馬遷 is Traditional, so the Wikidata
  // label is what actually appears in the article text.
  const candidates = [
    author.display_name,
    cached?.title,
    ...Object.values(cached?.names ?? {}),
  ]
    .filter(Boolean)
    .map((value) => value.trim())
    .filter(Boolean);

  for (const name of candidates) {
    if (extract.includes(name)) return true;
    // Western names appear as "Shakespeare" after a full first mention, and
    // CJK articles often use the surname alone.
    const parts = name.split(/[\s·・]+/).filter((part) => part.length >= 2);
    if (parts.some((part) => extract.includes(part))) return true;
  }
  return false;
}

function workSentence(sourceWork, language, author) {
  const title = cleanWorkTitle(sourceWork);
  if (!title) return null;
  const cached = workCache[`${language}:${title}`];
  if (!cached) return null;
  // A work title can land on a disambiguation page just as a personal name can.
  if (DISAMBIGUATION.test(cached.extract.slice(0, 120))) return null;
  if (!mentionsAuthor(cached.extract, author)) return null;

  const paragraph = cleanExtract(cached.extract)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)[0];
  if (!paragraph) return null;

  let summary = splitSentences(paragraph, language)[0];
  if (!summary) return null;

  // Wikipedia's opening sentence for a work can run very long (alternate
  // titles, translators, transliterations). Drop the parenthetical asides
  // before giving up on it, and skip the sentence if it is still unwieldy.
  if (summary.length > (language === "en" ? 220 : 90)) {
    summary = summary
      .replace(/（[^（）]*）/g, "")
      .replace(/\([^()]*\)/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,，、。])/g, "$1")
      .trim();
  }
  if (summary.length > (language === "en" ? 260 : 110)) return null;

  return { title: cached.title, summary };
}

function historicalEcho(quote, author) {
  const language = quote.language;
  const facts = biographyCache[author.author_ref]?.facts;
  const sentences = [];

  if (facts) {
    const era = eraPhrase(facts, language);
    const place = placePhrase(facts, language);
    const years = lifeYears(facts, language);
    const occupation = labelList(facts.occupation, language, 2, true);
    let movement = labelList(facts.movement ?? facts.era, language, 2, true);
    // Wikidata often files a period ("19th-century philosophy") as a movement,
    // which just repeats the era sentence.
    if (movement && era && movement.replace(/\s/g, "").includes(era.replace(/\s/g, ""))) {
      movement = null;
    }
    // The author's name is the heading of the screen this text sits under, so
    // repeating it here just says the same thing three times.
    const works = labelList(facts.notableWork, language, 3);
    const post = labelList(facts.position, language, 1, true);
    const employer = labelList(facts.employer, language, 1, true);
    const award = labelList(facts.award, language, 1, true);
    const field = labelList(facts.fieldOfWork, language, 2, true);

    // Sentence one: era, calling, and birthplace. P19 is where someone was
    // *born*, not where they lived, so the wording must not overclaim. Each
    // element is optional and the sentence contracts around what is missing.
    if (language === "zh-Hans") {
      const who = [era, occupation].filter(Boolean).join("的");
      if (who || place) {
        sentences.push(
          who
            ? `${who}${place ? `，生于${place}` : ""}。`
            : `生于${place}。`,
        );
      }
      if (works) sentences.push(`代表作有《${works.split("、").join("》《")}》。`);
      if (post) sentences.push(`曾任${post}。`);
      else if (employer) sentences.push(`曾任职于${employer}。`);
      if (award) sentences.push(`获${award}。`);
      if (movement) sentences.push(`其思想归入${movement}。`);
      else if (field) sentences.push(`研究领域包括${field}。`);
    } else if (language === "ja") {
      const who = [era, occupation].filter(Boolean).join("の");
      if (who || place) {
        sentences.push(
          who ? `${who}${place ? `。${place}の生まれ` : ""}。` : `${place}の生まれ。`,
        );
      }
      if (works) sentences.push(`代表作に『${works.split("、").join("』『")}』がある。`);
      if (post) sentences.push(`${post}を務めた。`);
      else if (employer) sentences.push(`${employer}に在職した。`);
      if (award) sentences.push(`${award}を受けた。`);
      if (movement) sentences.push(`その思想は${movement}に位置づけられる。`);
      else if (field) sentences.push(`研究領域は${field}。`);
    } else {
      const who = [era, occupation].filter(Boolean).join(" ");
      if (who || place) {
        const article = /^[aeiou]/i.test(who) ? "An" : "A";
        // Movement folds in here: a separate clause would have to name the
        // person again or guess a pronoun.
        const within = movement ? `, associated with ${movement}` : "";
        sentences.push(
          who
            ? `${article} ${who}${place ? `, born in ${place}` : ""}${within}.`
            : `Born in ${place}.`,
        );
      }
      if (works) sentences.push(`Best known for ${works}.`);
      if (post) sentences.push(`Held the office of ${post}.`);
      else if (employer) sentences.push(`Worked at ${employer}.`);
      if (award) sentences.push(`Received the ${award}.`);
      if (!movement && field) sentences.push(`Worked in ${field}.`);
    }
  }

  const work = workSentence(quote.source, language, author);
  if (work) {
    if (language === "zh-Hans") {
      sentences.push(`这句话见于《${work.title}》。${work.summary}`);
    } else if (language === "ja") {
      sentences.push(`この言葉は『${work.title}』に見える。${work.summary}`);
    } else {
      sentences.push(`The line appears in ${work.title}. ${work.summary}`);
    }
  }

  const sources = [];
  const bio = biographyCache[author.author_ref];
  if (bio?.title && sentences.length) {
    sources.push({
      title: bio.title,
      url: `https://${WIKIPEDIA_HOSTS[language]}/wiki/${encodeURIComponent(bio.title.replace(/ /g, "_"))}`,
      note: "Wikipedia, CC BY-SA 4.0",
    });
  }
  if (work) {
    sources.push({
      title: work.title,
      url: `https://${WIKIPEDIA_HOSTS[language]}/wiki/${encodeURIComponent(work.title.replace(/ /g, "_"))}`,
      note: "Wikipedia, CC BY-SA 4.0",
    });
  }

  if (!sentences.length) {
    return { echo: "", sources: [], status: "none" };
  }
  // Place names ending in a period ("Washington, D.C.") would otherwise end the
  // sentence with "..".
  const echo = sentences
    .join(language === "en" ? " " : "")
    .replace(/\.\.(?!\.)/g, ".")
    .replace(/。。+/g, "。")
    .replace(/、、+/g, "、");

  return {
    echo,
    sources,
    status: work ? "era_and_work" : "era_only",
  };
}

function authorBiography(author) {
  if (FACTUAL_BIOGRAPHIES[author.author_ref]) {
    return {
      biography: FACTUAL_BIOGRAPHIES[author.author_ref],
      sources: [],
      status: "verified",
    };
  }

  const fromWikipedia = wikipediaBiography(author);
  if (fromWikipedia) {
    return {
      biography: fromWikipedia.biography,
      sources: [fromWikipedia.source],
      status: "wikipedia_lead",
    };
  }

  // Nothing beyond the one-line catalog identity, which the profile screen
  // already prints under the name. Repeating it as a "life" paragraph was the
  // old behaviour and told the reader nothing, so leave it empty instead.
  return { biography: "", sources: [], status: "catalog_identity_only" };
}

// Quote a whole clause, never a character-count slice. The previous version
// joined the head and tail with an ellipsis, producing fragments that broke
// mid-word ("那些...然拥有希望") and read as machine output.
for (const author of contextDocument.authors) {
  if (ROLE_CORRECTIONS[author.author_id]) {
    author.known_role = ROLE_CORRECTIONS[author.author_id];
  }
  const { biography, sources, status } = authorBiography(author);
  author.biography = biography;
  author.biography_sources = sources;
  author.biography_content_status = status;
  // The author-level interpretive note was never rendered anywhere; the
  // historical echo on each context replaced what it was meant to do.
  delete author.editorial_note;
  delete author.editorial_note_kind;
}

const authorsByRef = new Map(
  contextDocument.authors.map((author) => [author.author_ref, author]),
);

function fingerprint(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function buildContext(quote) {
  const authorRef = `${quote.language}:${quote.author_id}`;
  const author = authorsByRef.get(authorRef);
  if (!author) throw new Error(`Missing author record for ${authorRef}`);
  const sourceWork = quote.source ?? null;

  return {
    quote_id: quote.id,
    language: quote.language,
    author_ref: authorRef,
    text_fingerprint: fingerprint(quote.text),
    source_work: sourceWork,
    context_sources: [],
  };
}

// Rebuild the context list from the published catalog: existing entries are
// preserved as-is, missing ones are generated, and orphans that no longer match
// a published quote are dropped. Order follows the catalog, so runs are stable.
const existingContexts = new Map(
  contextDocument.quote_contexts.map((context) => [
    String(context.quote_id),
    context,
  ]),
);
contextDocument.quote_contexts = quotes.map(
  (quote) => existingContexts.get(String(quote.id)) ?? buildContext(quote),
);

// Historical background belongs to an (author, work) pair, not to a single
// line, so quotations from the same text legitimately share it. Computing it
// once per pair keeps that sharing explicit instead of accidental.
const authorsByRefForEcho = new Map(
  contextDocument.authors.map((author) => [author.author_ref, author]),
);
const echoByPair = new Map();

for (const context of contextDocument.quote_contexts) {
  const quote = quotesById.get(String(context.quote_id));
  if (!quote) throw new Error(`Missing quote for context ${String(context.quote_id)}`);
  // Recompute rather than trust the stored value: 29 English entries carried a
  // fingerprint taken before quote text was normalized from "..." to "…".
  context.text_fingerprint = fingerprint(quote.text);

  const author = authorsByRefForEcho.get(context.author_ref);
  const pairKey = `${context.author_ref}||${cleanWorkTitle(quote.source) ?? ""}`;
  if (!echoByPair.has(pairKey)) {
    echoByPair.set(pairKey, historicalEcho(quote, author));
  }
  const { echo, sources, status } = echoByPair.get(pairKey);

  context.historical_echo = echo;
  context.historical_echo_sources = sources;
  context.historical_echo_status = status;

  // Every quotation is sourced from Wikiquote, so a per-context verification
  // flag that reads "pending" for all 4,283 records carried no information.
  // These three fields existed only to express that flag: context_type and
  // context_content_status restate whether source_work is set, and
  // context_summary was 829 KB of prose saying the occasion was unconfirmed.
  // context_sources stays — it holds real per-record provenance.
  delete context.verification_status;
  delete context.context_type;
  delete context.context_content_status;
  delete context.context_summary;
  delete context.editorial_note;
  delete context.editorial_note_kind;
}

const EDITORIAL_POLICY_ENTRIES = [
  "editorial_note 是从名言涉及的人生处境与情感经验出发的编辑解读，不代表作者原意或史实判断。",
  "事实状态只由 verification_status、content_status 和 sources 字段决定。",
];

// Filter by exact match: an earlier startsWith("editorial_note") check missed
// the second sentence, so every run appended another copy of it.
contextDocument.editorial_policy = [
  ...contextDocument.editorial_policy.filter(
    (entry) => !EDITORIAL_POLICY_ENTRIES.includes(entry),
  ),
  ...EDITORIAL_POLICY_ENTRIES,
];

// Recount rather than carrying stale numbers forward, so the statistics block
// surfaces data loss instead of hiding it.
const countBy = (items, predicate) => items.filter(predicate).length;
contextDocument.statistics = {
  quotes: quotes.length,
  language_scoped_authors: contextDocument.authors.length,
  quotes_with_source_work: countBy(
    contextDocument.quote_contexts,
    (context) => Boolean(context.source_work),
  ),
  quotes_without_source_work: countBy(
    contextDocument.quote_contexts,
    (context) => !context.source_work,
  ),
  quote_contexts_verified: countBy(
    contextDocument.quote_contexts,
    (context) => context.verification_status === "verified",
  ),
  quote_contexts_unverified: countBy(
    contextDocument.quote_contexts,
    (context) => context.verification_status === "unverified",
  ),
  quote_contexts_disputed: countBy(
    contextDocument.quote_contexts,
    (context) => context.verification_status === "disputed",
  ),
  biographies_verified: countBy(
    contextDocument.authors,
    (author) => author.biography_content_status === "verified",
  ),
  biographies_populated: countBy(contextDocument.authors, (author) =>
    Boolean(author.biography),
  ),
  quote_contexts_populated: contextDocument.quote_contexts.length,
};

fs.writeFileSync(contextsPath, `${JSON.stringify(contextDocument, null, 2)}\n`);
console.log(
  `Generated factual profiles for ${contextDocument.authors.length} authors and distinct readings for ${contextDocument.quote_contexts.length} quotes.`,
);
