import fs from "fs";
import path from "path";

const JSON_PATH = path.join(__dirname, "../QUOTE_CONTEXTS.json");
const BATCH_OUTPUT_PATH = path.join(__dirname, "../batch_output.jsonl");

function applyBatch() {
  console.log("📚 Loading QUOTE_CONTEXTS.json...");
  const doc = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));

  console.log("📥 Loading batch output...");
  const outputLines = fs.readFileSync(BATCH_OUTPUT_PATH, "utf-8").trim().split("\n");

  const resultMap = new Map<string, string>();

  // 解析 OpenAI 返回的 JSONL 结果
  for (const line of outputLines) {
    if (!line.trim()) continue;
    try {
      const res = JSON.parse(line);
      const customId = res.custom_id;
      
      if (!customId) continue;
      
      const authorRef = customId.split("___")[0];
      
      // 尝试不同的响应格式
      let generatedContent: string | null = null;
      
      // 格式1: 直接响应
      if (res.response?.body?.choices?.[0]?.message?.content) {
        generatedContent = res.response.body.choices[0].message.content.trim();
      }
      // 格式2: 简化响应
      else if (res.choices?.[0]?.message?.content) {
        generatedContent = res.choices[0].message.content.trim();
      }
      // 格式3: 字符串响应
      else if (typeof res.content === "string") {
        generatedContent = res.content.trim();
      }

      if (authorRef && generatedContent) {
        resultMap.set(authorRef, generatedContent);
      }
    } catch (e) {
      // 跳过解析错误的行
    }
  }

  console.log(`📊 解析完成: ${resultMap.size} 条结果`);

  // 写入原 JSON 数据
  let updated = 0;
  let skipped = 0;

  for (const ctx of doc.quote_contexts) {
    if (resultMap.has(ctx.author_ref)) {
      const content = resultMap.get(ctx.author_ref)!;
      
      // 验证内容长度
      if (content.length < 20 || content.length > 500) {
        skipped++;
        continue;
      }
      
      ctx.historical_echo = content;
      ctx.historical_echo_status = "era_and_work";
      updated++;
    }
  }

  fs.writeFileSync(JSON_PATH, JSON.stringify(doc, null, 2));
  
  console.log(`\n✅ 批量更新完成！`);
  console.log(`   成功写入: ${updated} 条`);
  console.log(`   跳过（格式异常）: ${skipped} 条`);
  console.log(`   总计: ${doc.quote_contexts.length} quotes`);
}

applyBatch();
