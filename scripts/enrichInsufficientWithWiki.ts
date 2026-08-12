import fs from "fs";
import path from "path";

const INSUFFICIENT_PATH = path.join(__dirname, "../batch_insufficient.jsonl");
const OUTPUT_PATH = path.join(__dirname, "../batch_insufficient_enriched.jsonl");

// 限速配置：每次请求间隔 2 秒
const RATE_LIMIT_MS = 2000;

async function getWikiExtract(authorName: string, lang: string): Promise<string | null> {
  const wikiLang = lang === "zh-Hans" ? "zh" : lang;
  const title = encodeURIComponent(authorName.replace(/\s+/g, "_"));
  const url = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${title}`;
  
  try {
    const res = await fetch(url, { 
      headers: { "User-Agent": "ECHO/1.0 (echo-app)" },
      signal: AbortSignal.timeout(10000)
    });
    if (res.status === 429) {
      console.log("   ⏳ 限流，等待 10s...");
      await new Promise(r => setTimeout(r, 10000));
      return getWikiExtract(authorName, lang); // 重试
    }
    if (!res.ok) return null;
    const data = await res.json();
    return data.extract || null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("📚 读取 batch_insufficient.jsonl...\n");
  
  const lines = fs.readFileSync(INSUFFICIENT_PATH, "utf-8").trim().split("\n");
  const enrichedLines: string[] = [];
  
  let enriched = 0;
  let failed = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const data = JSON.parse(lines[i]);
    const userMsg = data.body.messages[1].content;
    const authorName = userMsg.split("\n")[0].replace("作者：", "");
    const lang = userMsg.split("\n")[1].replace("语言：", "");
    
    process.stdout.write(`[${i + 1}/${lines.length}] ${authorName}... `);
    
    const wikiText = await getWikiExtract(authorName, lang);
    
    if (wikiText && wikiText.length > 100) {
      // 添加 Wiki 摘要到 user 消息
      data.body.messages[1].content = `作者：${authorName}\n语言：${lang}\n\n维基百科资料：\n${wikiText}`;
      enrichedLines.push(JSON.stringify(data));
      enriched++;
      console.log(`✅ (${wikiText.length} chars)`);
    } else {
      // 没有 Wiki 数据，保留原样
      enrichedLines.push(JSON.stringify(data));
      failed++;
      console.log("⚠️ 无Wiki数据");
    }
    
    // 限速
    if (i < lines.length - 1) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
    }
  }
  
  fs.writeFileSync(OUTPUT_PATH, enrichedLines.join("\n"));
  
  console.log(`\n✅ 完成！`);
  console.log(`   输出文件: ${OUTPUT_PATH}`);
  console.log(`   已添加 Wiki: ${enriched}`);
  console.log(`   无 Wiki 数据: ${failed}`);
  console.log(`   总条数: ${enrichedLines.length}`);
}

main().catch(console.error);
