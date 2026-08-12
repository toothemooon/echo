import fs from "fs";
import path from "path";

const JSON_PATH = path.join(__dirname, "../QUOTE_CONTEXTS.json");
const OUTPUT_PATH = path.join(__dirname, "../batch_input_full.jsonl");
const RETRY_PATH = path.join(__dirname, "../batch_retry.jsonl");

const MODEL = "gpt-5.6-luna";

// 需要过滤的无效条目
const INVALID_NAMES = [
  "authors", "teachers", "chinese proverb", "proverb",
  "ecclesiastes", "john 8", "john 3", "john 1", "john 2",
  "matthew", "romans", "corinthians", "galatians", "ephesians",
  "philippians", "colossians", "thessalonians", "hebrews",
  "james 1", "peter 1", "peter 2", "1 john", "2 john", "3 john",
  "jude", "revelation", "acts", "psalm", "proverbs",
  "unknown", "various", "anonymous", "traditional",
  "book of", "chapter", "verse",
];

const INVALID_NAMES_CN_JA = ["谚语", "俗语", "名言", "格言", "ことわざ", "格言", "諺"];

// 带 INSUFFICIENT_DATA 硬约束的 System Prompt
const SYSTEM_PROMPTS: Record<string, string> = {
  "zh-Hans": `你是一位深谙历史与哲学的人文作家。
请根据你对该人物的了解，【彻底放弃】通用生平概况（生卒、职业、成就列表）。
你必须【仅仅挑选一个】该人物一生中最具戏剧张力的【单一具体历史事件】。
要求：
1. 聚焦单一镜头（80-120字，2-3句话）。
2. 结构：镜头切入(时间/地点/困局) -> 关键抉择/思想爆发 -> 历史余音。
3. 严禁全盘总结职业生涯，严禁使用"总而言之"等套话。纯正文输出，不要任何标题或前缀。
【硬约束】如果你对该人物一无所知，或者该名字存在严重歧义（如只叫 Ali 或 數學家）无法确定具体身份，请直接输出纯文本代码：INSUFFICIENT_DATA。绝不允许胡编乱造，绝不允许向我提问或输出其他废话。`,

  en: `You are a literary historian and philosophical writer.
Based on your knowledge of this person, extract EXACTLY ONE dramatic, pivotal historic moment. Ignore general biographical overviews.
Requirements:
1. Focus on a single vivid scene (40-60 words, 2-3 sentences).
2. Avoid formulaic openings. Vary sentence structures using action, tension, or context.
3. Structure: Scene/Crisis -> Pivotal Action/Insight -> Historical Resonance.
4. Do not summarize their entire life. Output ONLY story text, no titles or prefixes.
HARD CONSTRAINT: If you lack sufficient knowledge about this specific person, or if the name is too ambiguous to identify a unique historical figure (e.g., 'Ali' or 'Mathematician'), output EXACTLY the text: INSUFFICIENT_DATA. Do NOT hallucinate events, and do NOT ask any questions.`,

  ja: `あなたは歴史と哲学に精通した人文作家です。
この人物についてあなたの知識に基づき、生涯の一般的な略歴を【完全に捨て】、その人物の人生で最もドラマチックな【単一の具体的事実・事件】のみを1つ切り出してください。
要求：
1. 単一の場面に凝縮（80〜120文字、2〜3文）。
2. 機械的な書き出しの重複を避け、現場の危機感や葛藤から書き出してください。
3. 構成：場面・危機 -> 決断・思想の爆発 -> 歴史の余韻。
4. 略歴や作品リストの網羅は厳禁。本文のみ出力してください。
【硬約束】この人物に関する知識が不足している場合、または名前が曖昧で特定の歴史上の人物を特定できない場合（例：「Ali」や「数学者」）は、純粋なテキストで INSUFFICIENT_DATA とのみ出力してください。決して架空の出来事を捏造したり、質問したりしないでください。`,
};

function isValidPersonName(name: string, lang: string): boolean {
  const lower = name.toLowerCase().trim();
  if (!lower || lower.length < 2) return false;
  if (lang === "en") {
    for (const invalid of INVALID_NAMES) {
      if (lower.includes(invalid)) return false;
    }
  }
  if (lang === "zh-Hans" || lang === "ja") {
    for (const invalid of INVALID_NAMES_CN_JA) {
      if (lower.includes(invalid)) return false;
    }
  }
  if (/^[a-z]+_\d+$/.test(lower)) return false;
  if (/^[a-z]+\s+\d+\s+\d+$/.test(lower)) return false;
  return true;
}

function getAuthorDisplayName(authorRef: string, authors: any[]): string {
  const author = authors.find((a: any) => a.author_ref === authorRef);
  return author?.display_name || "";
}

function cleanCustomId(authorRef: string, lang: string): string {
  return `${authorRef}___${lang}`.replace(/:/g, "_");
}

// 生成全量 batch
async function generateFullBatch() {
  console.log("📚 生成全量 batch...\n");
  const doc = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
  const contexts = doc.quote_contexts;
  const authors = doc.authors;

  const updated = ['1905, 26-year-old','399 BC','1888','170 AD','1902','1889','497 BC','1925','1776','6th century BC','1712','322 BC','1965','1964','528 BC','1931','1977','1950','1893','1969','2010','1945','November 1989','1935, Leningrad','1963, Lima','1958, Lagos','1965, Ibadan','1977, Los Angeles','1950, Mexico City','1893, Arctic Ocean','1913, Lisbon','March 1959, Lhasa','1933, Oslo','1871, University'];

  const seen = new Set<string>();
  const pending: Array<{ item: any; displayName: string }> = [];
  let filteredInvalid = 0;
  let filteredDuplicate = 0;

  for (const item of contexts) {
    const customId = cleanCustomId(item.author_ref, item.language);
    if (seen.has(customId)) { filteredDuplicate++; continue; }
    seen.add(customId);
    if (updated.some(kw => item.historical_echo.includes(kw))) continue;
    
    const displayName = getAuthorDisplayName(item.author_ref, authors);
    if (!displayName) continue;
    if (!isValidPersonName(displayName, item.language)) { filteredInvalid++; continue; }
    
    pending.push({ item, displayName });
  }

  const lines: string[] = [];
  for (const { item, displayName } of pending) {
    const lang = item.language;
    lines.push(JSON.stringify({
      custom_id: cleanCustomId(item.author_ref, lang),
      method: "POST",
      url: "/v1/chat/completions",
      body: {
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS["en"] },
          { role: "user", content: `作者：${displayName}\n语言：${lang}` },
        ],
        max_completion_tokens: 10000,
      },
    }));
  }

  fs.writeFileSync(OUTPUT_PATH, lines.join("\n"));
  console.log(`✅ 全量 batch: ${OUTPUT_PATH} (${lines.length} 条)`);
  console.log(`   过滤无效: ${filteredInvalid}, 重复: ${filteredDuplicate}`);
}

// 生成重试 batch
async function generateRetryBatch() {
  console.log("\n📚 生成重试 batch...\n");
  
  if (!fs.existsSync(RETRY_PATH.replace('.jsonl', '_input.jsonl'))) {
    console.log("   无重试文件");
    return;
  }
  
  // 读取失败的 custom_ids
  const retryInput = fs.readFileSync(RETRY_PATH.replace('.jsonl', '_input.jsonl'), 'utf-8').trim().split('\n');
  const failedIds = new Set(retryInput.map(line => JSON.parse(line).custom_id));
  
  const doc = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
  const authors = doc.authors;
  
  const retryLines: string[] = [];
  
  for (const item of doc.quote_contexts) {
    const customId = cleanCustomId(item.author_ref, item.language);
    if (!failedIds.has(customId)) continue;
    
    const displayName = getAuthorDisplayName(item.author_ref, authors);
    if (!displayName || !isValidPersonName(displayName, item.language)) continue;
    
    const lang = item.language;
    retryLines.push(JSON.stringify({
      custom_id: customId,
      method: "POST",
      url: "/v1/chat/completions",
      body: {
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS["en"] },
          { role: "user", content: `作者：${displayName}\n语言：${lang}` },
        ],
        max_completion_tokens: 10000,
      },
    }));
  }
  
  const retryPath = path.join(__dirname, "../batch_retry.jsonl");
  fs.writeFileSync(retryPath, retryLines.join("\n"));
  console.log(`✅ 重试 batch: ${retryPath} (${retryLines.length} 条)`);
}

async function main() {
  // 生成全量
  await generateFullBatch();
  
  // 生成重试（如果有失败文件）
  if (fs.existsSync(path.join(__dirname, "../batch_retry_input.jsonl"))) {
    await generateRetryBatch();
  }
}

main().catch(console.error);
