import fs from "node:fs";

const catalogs = [
  {
    language: "en",
    path: new URL("../assets/quotes.json", import.meta.url),
    expectedCount: 2000,
  },
  {
    language: "zh-Hans",
    path: new URL("../assets/quotes.zh-Hans.json", import.meta.url),
    expectedCount: 894,
  },
  {
    language: "ja",
    path: new URL("../assets/quotes.ja.json", import.meta.url),
    expectedCount: 2000,
  },
];
const reportPath = new URL(
  "../data/quote-audit/expanded-catalog-report.json",
  import.meta.url,
);
const genericRole =
  /^(writer|author|poet|philosopher|unknown|public figure|历史与文化人物|日本の歴史的人物)$/i;
const markup =
  /\{\{|\[\[|\]\]|<ref|https?:|Category:|File:|分類:|分类:/;

function normalizedText(value) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\s“”‘’"'.,!?;:—–\-()[\]{}]/g, "");
}

const combined = [];
const languageReports = {};

for (const catalog of catalogs) {
  const quotes = JSON.parse(fs.readFileSync(catalog.path, "utf8"));
  const ids = quotes.map((quote) => String(quote.id));
  const texts = quotes.map((quote) => normalizedText(quote.text));
  const authorCounts = new Map();
  const categoryCounts = {};

  for (const quote of quotes) {
    authorCounts.set(
      quote.author_id,
      (authorCounts.get(quote.author_id) ?? 0) + 1,
    );
    categoryCounts[quote.primary_category] =
      (categoryCounts[quote.primary_category] ?? 0) + 1;
  }

  const problems = {
    duplicate_ids: ids.length - new Set(ids).size,
    duplicate_texts: texts.length - new Set(texts).size,
    invalid_language: quotes.filter(
      (quote) => quote.language !== catalog.language,
    ).length,
    missing_author: quotes.filter((quote) => !quote.author?.trim()).length,
    missing_role: quotes.filter((quote) => !quote.role?.trim()).length,
    generic_role: quotes.filter((quote) => genericRole.test(quote.role)).length,
    residual_markup: quotes.filter((quote) => markup.test(quote.text)).length,
  };

  if (
    quotes.length !== catalog.expectedCount ||
    Object.values(problems).some((value) => value !== 0)
  ) {
    throw new Error(
      `${catalog.language} catalog failed: ` +
        JSON.stringify({ count: quotes.length, ...problems }),
    );
  }

  languageReports[catalog.language] = {
    count: quotes.length,
    unique_ids: new Set(ids).size,
    unique_texts: new Set(texts).size,
    unique_authors: new Set(
      quotes.map((quote) => quote.author_id),
    ).size,
    records_with_work_source: quotes.filter((quote) => quote.source).length,
    maximum_text_length: Math.max(
      ...quotes.map((quote) => quote.text.length),
    ),
    maximum_quotes_per_author: Math.max(...authorCounts.values()),
    category_counts: categoryCounts,
    problems,
  };
  combined.push(...quotes);
}

const combinedIds = combined.map((quote) => String(quote.id));
const combinedTexts = combined.map((quote) =>
  normalizedText(quote.text),
);
const report = {
  generated_at: new Date().toISOString(),
  total_records: combined.length,
  unique_ids: new Set(combinedIds).size,
  unique_texts: new Set(combinedTexts).size,
  catalogs: languageReports,
  provenance: {
    english: [
      "Controlled ECHO English catalog",
      "English Wikiquote",
    ],
    simplified_chinese: ["Chinese Wikiquote"],
    japanese: ["Japanese Wikiquote"],
  },
  quality_rules: [
    "Exactly 2,000 English records, 894 published Chinese records, and 2,000 Japanese records.",
    "No duplicate ID or normalized text.",
    "No empty author or role.",
    "No generic Writer, Author, unknown, or generic historical-person role.",
    "No residual wiki markup, category marker, URL, or ref tag in quote text.",
    "Wikiquote additions retain revision-level provenance.",
  ],
};

if (
  report.total_records !== 4894 ||
  report.unique_ids !== 4894 ||
  report.unique_texts !== 4894
) {
  throw new Error("Combined catalog uniqueness check failed.");
}

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
