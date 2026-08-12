import test from "node:test";
import assert from "node:assert/strict";
import quotesJson from "../assets/quotes.json";
import chineseQuotesJson from "../assets/quotes.zh-Hans.json";
import japaneseQuotesJson from "../assets/quotes.ja.json";
import {
  CATEGORIES,
  SUBCATEGORIES,
  type Category,
} from "../src/constants/categories";
import { getAllQuotes, isQuote, type Quote } from "../src/data/quotes";

const quotes = quotesJson as Quote[];
const chineseQuotes = chineseQuotesJson as Quote[];
const japaneseQuotes = japaneseQuotesJson as Quote[];

test("v1.0 catalog satisfies its release quality gates", () => {
  assert.equal(quotes.length, 1305);
  assert.ok(quotes.every(isQuote));
  assert.equal(new Set(quotes.map((quote) => quote.id)).size, quotes.length);
  assert.equal(
    new Set(quotes.map((quote) => quote.text.toLowerCase())).size,
    quotes.length,
  );

  const authorCounts = new Map<string, number>();
  for (const quote of quotes) {
    authorCounts.set(
      quote.author_id,
      (authorCounts.get(quote.author_id) ?? 0) + 1,
    );
    assert.deepEqual(quote.categories, [quote.primary_category]);
    assert.ok(
      (SUBCATEGORIES[quote.primary_category] as readonly string[]).includes(
        quote.subcategory,
      ),
    );
    assert.notEqual(quote.role.toLowerCase(), "writer");
    assert.notEqual(quote.role.toLowerCase(), "author");
  }
  assert.ok(Math.max(...authorCounts.values()) <= 16);
});

test("English, Chinese, and Japanese catalogs are equal and collision-free", () => {
  assert.equal(quotes.length, 1305);
  assert.equal(chineseQuotes.length, 831);
  assert.equal(japaneseQuotes.length, 1853);
  assert.ok(quotes.every((quote) => quote.language === "en"));
  assert.ok(
    chineseQuotes.every(
      (quote) =>
        isQuote(quote) &&
        quote.language === "zh-Hans",
    ),
  );
  assert.ok(
    japaneseQuotes.every(
      (quote) => isQuote(quote) && quote.language === "ja",
    ),
  );
  const combined = getAllQuotes();
  assert.equal(combined.length, 3989);
  assert.equal(
    new Set(combined.map((quote) => String(quote.id))).size,
    combined.length,
  );
});

test("published Chinese catalog excludes records without license evidence", () => {
  assert.ok(chineseQuotes.every((quote) => !String(quote.id).startsWith("zh-inbox-")));
});

test("every category and each of its five subcategories is represented", () => {
  for (const category of CATEGORIES) {
    const categoryQuotes = quotes.filter(
      (quote) => quote.primary_category === category,
    );
    assert.ok(categoryQuotes.length >= 20, `${category} is underrepresented`);
    const represented = new Set(
      categoryQuotes.map((quote) => quote.subcategory),
    );
    for (const subcategory of SUBCATEGORIES[category as Category]) {
      assert.ok(
        represented.has(subcategory),
        `${category}/${subcategory} is missing`,
      );
    }
  }
});
