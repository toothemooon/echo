/**
 * Wikipedia REST API 服务
 * 用于获取作者的维基百科摘要，为后续生成 defining_moment 提供原材料
 */

const WIKI_API_BASE =
  "https://{lang}.wikipedia.org/api/rest_v1/page/summary";

export type WikipediaSummary = {
  extract: string;
  pageUrl: string;
  thumbnail?: string;
  description?: string;
};

/**
 * 将作者名转为 Wikipedia title 格式
 * - 空格 → 下划线
 * - 保留原始大小写（Wikipedia 不区分大小写）
 */
function toWikiTitle(name: string): string {
  return name.replace(/\s+/g, "_");
}

/**
 * 获取作者的 Wikipedia 摘要
 * @param authorName - 作者名（如 "Albert Einstein"）
 * @param language - 语言代码（"en", "zh", "ja"）
 * @returns 摘要信息，或 null（如果找不到）
 */
export async function getWikipediaSummary(
  authorName: string,
  language: string = "en"
): Promise<WikipediaSummary | null> {
  if (!authorName?.trim()) return null;

  const title = toWikiTitle(authorName.trim());
  const url = WIKI_API_BASE
    .replace("{lang}", language)
    + "/" + encodeURIComponent(title);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ECHO/1.0 (https://github.com/user/echo)",
      },
    });

    // 404 表示页面不存在
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.warn(
        `[Wikipedia] API error: ${response.status} for "${authorName}"`
      );
      return null;
    }

    const data = await response.json();

    // 确保有有效的 extract
    if (!data.extract || typeof data.extract !== "string") {
      return null;
    }

    return {
      extract: data.extract,
      pageUrl: data.content_urls?.desktop?.page ?? "",
      thumbnail: data.thumbnail?.source,
      description: data.description,
    };
  } catch (error) {
    console.warn(
      `[Wikipedia] Fetch failed for "${authorName}":`,
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

/**
 * 批量获取多个作者的摘要（带简单限流）
 * @param authors - 作者名数组
 * @param language - 语言代码
 * @param delayMs - 每次请求间隔（毫秒），避免触发限流
 */
export async function getWikipediaSummaries(
  authors: string[],
  language: string = "en",
  delayMs: number = 100
): Promise<Map<string, WikipediaSummary | null>> {
  const results = new Map<string, WikipediaSummary | null>();

  for (const author of authors) {
    const summary = await getWikipediaSummary(author, language);
    results.set(author, summary);

    // 简单限流
    if (delayMs > 0 && authors.indexOf(author) < authors.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
