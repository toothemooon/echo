#!/usr/bin/env npx tsx
/**
 * 批量生成 Defining Moment 脚本
 * 
 * 用法: npx tsx scripts/generateDefiningMoments.ts
 * 
 * 此脚本：
 * 1. 从 QUOTE_CONTEXTS.json 读取所有作者
 * 2. 调用 Wikipedia API 获取摘要
 * 3. 输出需要生成 defining_moment 的作者列表
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const QUOTE_CONTEXTS_PATH = join(__dirname, "..", "QUOTE_CONTEXTS.json");
const OUTPUT_PATH = join(__dirname, "..", "DEFINING_MOMENTS.json");

type QuoteContextDocument = {
  authors: Array<{
    author_ref: string;
    language: string;
    author_id: string;
    display_name: string;
    biography: string;
  }>;
};

type DefiningMomentEntry = {
  author_ref: string;
  language: string;
  author_id: string;
  display_name: string;
  defining_moment: string | null;
  wiki_url: string | null;
  generated_at: number | null;
};

async function fetchWikipediaSummary(
  name: string,
  language: string
): Promise<{ extract: string; url: string } | null> {
  const langCode = language === "zh-Hans" ? "zh" : language;
  const title = name.replace(/\s+/g, "_");
  const url = `https://${langCode}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "ECHO/1.0" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      extract: data.extract || "",
      url: data.content_urls?.desktop?.page || "",
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log("📚 Loading authors from QUOTE_CONTEXTS.json...\n");

  const raw = readFileSync(QUOTE_CONTEXTS_PATH, "utf-8");
  const doc = JSON.parse(raw) as QuoteContextDocument;

  // 去重：同一个作者可能有多条引用
  const uniqueAuthors = new Map<
    string,
    { ref: string; name: string; language: string }
  >();

  for (const author of doc.authors) {
    if (!uniqueAuthors.has(author.author_ref)) {
      uniqueAuthors.set(author.author_ref, {
        ref: author.author_ref,
        name: author.display_name,
        language: author.language,
      });
    }
  }

  console.log(`📊 Found ${uniqueAuthors.size} unique authors\n`);

  // 检查已有的 defining moments
  let existing: DefiningMomentEntry[] = [];
  if (existsSync(OUTPUT_PATH)) {
    existing = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
    console.log(`📋 Found ${existing.length} existing entries\n`);
  }

  const existingMap = new Map(existing.map((e) => [e.author_ref, e]));
  const results: DefiningMomentEntry[] = [];

  let processed = 0;
  let fetched = 0;
  let errors = 0;

  for (const [ref, author] of uniqueAuthors) {
    // 跳过已生成的
    if (existingMap.has(ref)) {
      results.push(existingMap.get(ref)!);
      continue;
    }

    processed++;
    process.stdout.write(
      `[${processed}/${uniqueAuthors.size}] ${author.name}... `
    );

    const wiki = await fetchWikipediaSummary(author.name, author.language);

    if (wiki) {
      fetched++;
      results.push({
        author_ref: ref,
        language: author.language,
        author_id: author.ref.split(":")[1],
        display_name: author.name,
        defining_moment: null, // 待 AI 生成
        wiki_url: wiki.url,
        generated_at: null,
      });
      console.log(`✅ Wiki found (${wiki.extract.length} chars)`);
    } else {
      errors++;
      results.push({
        author_ref: ref,
        language: author.language,
        author_id: author.ref.split(":")[1],
        display_name: author.name,
        defining_moment: null,
        wiki_url: null,
        generated_at: null,
      });
      console.log("❌ No wiki page");
    }

    // 限流
    await new Promise((r) => setTimeout(r, 100));
  }

  // 保存结果
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));

  console.log("\n📊 Summary:");
  console.log(`   Total authors: ${uniqueAuthors.size}`);
  console.log(`   Wiki pages found: ${fetched}`);
  console.log(`   Errors: ${errors}`);
  console.log(`\n💾 Results saved to ${OUTPUT_PATH}`);
  console.log(`\n📝 Next step: Run AI to generate defining_moment for each entry`);
}

main().catch(console.error);
