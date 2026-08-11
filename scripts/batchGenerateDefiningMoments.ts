#!/usr/bin/env npx tsx
/**
 * 批量生成 Defining Moment 内容
 * 
 * 用法: npx tsx scripts/batchGenerateDefiningMoments.ts
 * 
 * 此脚本会：
 * 1. 读取 DEFINING_MOMENTS.json 中有 Wikipedia URL 但没有 defining_moment 的作者
 * 2. 获取 Wikipedia 摘要
 * 3. 输出需要生成内容的作者列表供 AI 处理
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DEFINING_MOMENTS_PATH = join(__dirname, "..", "DEFINING_MOMENTS.json");

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
  url: string
): Promise<string | null> {
  // 从 URL 提取 API 端点
  const apiUrl = url.replace(
    "https://en.wikipedia.org/wiki/",
    "https://en.wikipedia.org/api/rest_v1/page/summary/"
  ).replace(
    /\/wiki\/(.+)/,
    (_, title) => `/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );

  try {
    const response = await fetch(apiUrl, {
      headers: { "User-Agent": "ECHO/1.0" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.extract || null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("📚 Loading DEFINING_MOMENTS.json...\n");

  const raw = readFileSync(DEFINING_MOMENTS_PATH, "utf-8");
  const entries = JSON.parse(raw) as DefiningMomentEntry[];

  // 筛选需要生成内容的作者
  const pending = entries.filter(
    (e) => e.wiki_url && !e.defining_moment
  );

  console.log(`📊 Total entries: ${entries.length}`);
  console.log(`📝 Pending generation: ${pending.length}`);
  console.log(`✅ Already generated: ${entries.filter((e) => e.defining_moment).length}\n`);

  // 获取前 20 个作者的 Wikipedia 摘要作为示例
  const sampleSize = Math.min(20, pending.length);
  console.log(`🔍 Fetching Wikipedia summaries for ${sampleSize} authors...\n`);

  const samples: Array<{
    name: string;
    language: string;
    summary: string;
  }> = [];

  for (let i = 0; i < sampleSize; i++) {
    const entry = pending[i];
    process.stdout.write(`[${i + 1}/${sampleSize}] ${entry.display_name}... `);

    const summary = await fetchWikipediaSummary(entry.wiki_url!);
    if (summary) {
      samples.push({
        name: entry.display_name,
        language: entry.language,
        summary,
      });
      console.log(`✅ (${summary.length} chars)`);
    } else {
      console.log("❌ Failed to fetch");
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  // 输出样本供 AI 生成
  console.log("\n" + "=".repeat(80));
  console.log("📝 SAMPLES FOR AI GENERATION");
  console.log("=".repeat(80) + "\n");

  for (const sample of samples) {
    console.log(`### ${sample.name} (${sample.language})`);
    console.log(`**Wikipedia Summary:**`);
    console.log(sample.summary.substring(0, 500) + "...\n");
  }

  // 保存样本到文件
  const samplePath = join(__dirname, "..", "DEFINING_MOMENT_SAMPLES.json");
  writeFileSync(samplePath, JSON.stringify(samples, null, 2));
  console.log(`\n💾 Samples saved to ${samplePath}`);
}

main().catch(console.error);
