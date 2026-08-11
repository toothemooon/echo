const REQUEST_DELAY_MS = 320;

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function createWikiquoteClient(api, languageLabel) {
  let previousRequestAt = 0;

  async function getJson(params) {
    for (let attempt = 0; attempt < 7; attempt += 1) {
      const waitFor =
        REQUEST_DELAY_MS - (Date.now() - previousRequestAt);
      if (waitFor > 0) await sleep(waitFor);

      const url = new URL(api);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }

      previousRequestAt = Date.now();
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            `ECHO-Quote-App/1.0 (${languageLabel} content import; ` +
            "contact: abc510433622@gmail.com)",
        },
      });
      const body = await response.text();

      if (response.ok && body.trimStart().startsWith("{")) {
        const parsed = JSON.parse(body);
        if (!parsed.error) return parsed;
      }

      await sleep(900 * (attempt + 1));
    }

    throw new Error(`${languageLabel} Wikiquote API request failed.`);
  }

  async function collectCategoryPages(rootCategories, maxDepth = 0) {
    const queue = rootCategories.map((title) => ({ title, depth: 0 }));
    const visitedCategories = new Set();
    const pageTitles = new Set();

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visitedCategories.has(current.title)) continue;
      visitedCategories.add(current.title);

      let continuation = {};
      do {
        const response = await getJson({
          action: "query",
          list: "categorymembers",
          cmtitle: current.title,
          cmlimit: "500",
          format: "json",
          formatversion: 2,
          ...continuation,
        });

        for (const member of response.query.categorymembers) {
          if (member.ns === 0) {
            pageTitles.add(member.title);
          } else if (
            member.ns === 14 &&
            current.depth < maxDepth &&
            !visitedCategories.has(member.title)
          ) {
            queue.push({
              title: member.title,
              depth: current.depth + 1,
            });
          }
        }

        continuation = response.continue ?? {};
      } while (continuation.cmcontinue);
    }

    return {
      titles: [...pageTitles].sort((left, right) =>
        left.localeCompare(right),
      ),
      categories: [...visitedCategories],
    };
  }

  async function fetchPages(titles) {
    const pages = [];

    for (let offset = 0; offset < titles.length; offset += 50) {
      const response = await getJson({
        action: "query",
        prop: "revisions|categories|pageprops",
        titles: titles.slice(offset, offset + 50).join("|"),
        rvprop: "ids|content",
        rvslots: "main",
        cllimit: "max",
        format: "json",
        formatversion: 2,
      });
      pages.push(
        ...response.query.pages.filter((page) => !page.missing),
      );
    }

    return pages;
  }

  async function getEntities(ids, language) {
    return getJson({
      action: "wbgetentities",
      ids: ids.join("|"),
      props: "descriptions",
      languages: language,
      format: "json",
      formatversion: 2,
    });
  }

  return {
    collectCategoryPages,
    fetchPages,
    getEntities,
  };
}

export async function fetchWikidataDescriptions(pages, language) {
  const qids = [
    ...new Set(
      pages
        .map((page) => page.pageprops?.wikibase_item)
        .filter(Boolean),
    ),
  ];
  const descriptions = new Map();
  const client = createWikiquoteClient(
    "https://www.wikidata.org/w/api.php",
    `Wikidata ${language}`,
  );

  for (let offset = 0; offset < qids.length; offset += 50) {
    const response = await client.getEntities(
      qids.slice(offset, offset + 50),
      language,
    );
    for (const entity of Object.values(response.entities ?? {})) {
      const description = entity.descriptions?.[language]?.value?.trim();
      if (description) descriptions.set(entity.id, description);
    }
  }

  return descriptions;
}

export function cleanWikiMarkup(value) {
  let output = String(value ?? "");

  for (let pass = 0; pass < 4; pass += 1) {
    output = output.replace(/\{\{[^{}]*\}\}/g, "");
  }

  return output
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<ref\b[^>]*\/>/gi, "")
    .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\[(?:https?:\/\/\S+)\s+([^\]]+)\]/g, "$1")
    .replace(/'{2,5}/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// Source-work strings come straight from Wikiquote and carry citation debris:
// URLs, trailing years, section markers, and generic labels that name no work.
// Shared so the fetcher and the generator agree on the cache key.
const GENERIC_WORK =
  /^(名句|名言|語録|语录|各本|俳句|小説|詩|诗|作品|外部リンク|外部链接|external links?|quotes?|attributed|misattributed|disputed|unsourced)$/i;

export function cleanWorkTitle(value) {
  const cleaned = String(value ?? "")
    .replace(/\[[^\]]*https?:[^\]]*\]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/=+\s*$/g, "")
    .replace(/^[《『「“"（(]+|[》』」”"）)]+$/g, "")
    .replace(/[,，]\s*\d{4}\s*$/, "")
    .replace(/\s*\(\s*\d{4}[^)]*\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.length > 60) return null;
  if (GENERIC_WORK.test(cleaned)) return null;
  if (/^\d+$/.test(cleaned)) return null;
  return cleaned;
}

export function normalizedQuoteKey(value) {
  return String(value)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\s“”‘’"'.,!?;:—–\-()[\]{}]/g, "");
}
