/**
 * Defining Moment 生成服务
 * 使用 OpenAI API 将 Wikipedia 摘要转化为沉浸式叙事
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getWikipediaSummary, type WikipediaSummary } from "./wikipedia";

// 缓存 key
const DEFINING_MOMENT_CACHE_KEY = "@echo/defining_moments";
const API_KEY_STORAGE_KEY = "@echo/openai_api_key";

export type DefiningMomentResult = {
  authorRef: string;
  definingMoment: string;
  wikiPageUrl: string;
  generatedAt: number;
};

/**
 * 获取/设置 OpenAI API Key
 */
export async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(API_KEY_STORAGE_KEY);
}

export async function setApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(API_KEY_STORAGE_KEY, key);
}

/**
 * 用于生成 defining_moment 的 prompt 模板
 */
function buildPrompt(authorName: string, language: string, wikiSummary: string): string {
  const languageInstruction =
    language === "zh-Hans"
      ? "请使用简体中文撰写。"
      : language === "ja"
        ? "日本語で執筆してください。"
        : "Write in English.";

  return `You are a humanist writer well-versed in history and philosophy. Based on the following Wikipedia summary of "${authorName}", write a concise "Defining Moment" narrative.

【Wikipedia Summary】:
${wikiSummary}

【Requirements】:
1. Length: Strictly 80-120 characters (2-3 sentences).
2. Structure:
   - Sentence 1: Set the scene with key time/place and the crisis or turning point;
   - Sentence 2: Describe the pivotal choice, action, or intellectual breakthrough;
   - Sentence 3: Capture the lasting historical significance or echoing impact.
3. Tone: Contemplative, concise, with historical weight. Avoid empty platitudes.
4. Language: ${languageInstruction}

Output ONLY the narrative text, no prefixes or explanations.`;
}

/**
 * 调用 OpenAI API 生成 defining_moment
 */
async function callLLM(prompt: string): Promise<string | null> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    console.warn("[DefiningMoment] No API key configured");
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a concise humanist writer who crafts immersive historical narratives in 80-120 characters.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn("[DefiningMoment] API error:", error);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) return null;

    // 验证长度（80-120 字符，允许一定浮动）
    if (content.length < 50 || content.length > 200) {
      console.warn(
        `[DefiningMoment] Content length ${content.length} outside expected range`
      );
      // 仍然返回，但记录警告
    }

    return content;
  } catch (error) {
    console.warn(
      "[DefiningMoment] LLM call failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

/**
 * 从本地缓存获取 defining_moment
 */
export async function getCachedDefiningMoment(
  authorRef: string
): Promise<DefiningMomentResult | null> {
  try {
    const raw = await AsyncStorage.getItem(DEFINING_MOMENT_CACHE_KEY);
    if (!raw) return null;

    const cache = JSON.parse(raw) as Record<string, DefiningMomentResult>;
    return cache[authorRef] ?? null;
  } catch {
    return null;
  }
}

/**
 * 保存 defining_moment 到本地缓存
 */
async function saveDefiningMomentToCache(
  result: DefiningMomentResult
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(DEFINING_MOMENT_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};

    cache[result.authorRef] = result;
    await AsyncStorage.setItem(DEFINING_MOMENT_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("[DefiningMoment] Cache save failed:", error);
  }
}

/**
 * 生成 defining_moment
 * 流程：检查缓存 → 获取 Wikipedia → 调用 LLM → 保存缓存
 */
export async function generateDefiningMoment(
  authorRef: string,
  authorName: string,
  language: string = "en"
): Promise<DefiningMomentResult | null> {
  // 1. 检查缓存
  const cached = await getCachedDefiningMoment(authorRef);
  if (cached) {
    return cached;
  }

  // 2. 获取 Wikipedia 摘要
  const wikiSummary = await getWikipediaSummary(authorName, language);
  if (!wikiSummary) {
    console.log(`[DefiningMoment] No Wikipedia page found for "${authorName}"`);
    return null;
  }

  // 3. 调用 LLM 生成 defining_moment
  const prompt = buildPrompt(authorName, language, wikiSummary.extract);
  const definingMoment = await callLLM(prompt);

  if (!definingMoment) {
    console.log(`[DefiningMoment] LLM generation failed for "${authorName}"`);
    return null;
  }

  // 4. 构建结果
  const result: DefiningMomentResult = {
    authorRef,
    definingMoment,
    wikiPageUrl: wikiSummary.pageUrl,
    generatedAt: Date.now(),
  };

  // 5. 保存到缓存
  await saveDefiningMomentToCache(result);

  return result;
}

/**
 * 批量预生成 defining_moment（可在后台运行）
 */
export async function pregenerateDefiningMoments(
  authors: Array<{ ref: string; name: string; language: string }>,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < authors.length; i++) {
    const { ref, name, language } = authors[i];

    // 跳过已缓存的
    const cached = await getCachedDefiningMoment(ref);
    if (!cached) {
      await generateDefiningMoment(ref, name, language);
    }

    onProgress?.(i + 1, authors.length);

    // 限流：每次请求间隔 200ms
    if (i < authors.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
}
