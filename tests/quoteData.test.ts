import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllQuotes,
  getQuoteById,
  getQuotesByCategories,
  isQuote,
  type Quote,
} from "../src/data/quotes";

const validQuote: Quote = {
  id: "test-quote",
  text: "A valid quote",
  language: "en",
  author_id: "test_author",
  author: "Test Author",
  role: "Test role",
  primary_category: "WISDOM",
  subcategory: "TRUTH",
  categories: ["WISDOM"],
};

test("quote validation rejects malformed IDs, languages, sources, and taxonomy", () => {
  assert.equal(isQuote(validQuote), true);
  assert.equal(isQuote({ ...validQuote, id: " " }), false);
  assert.equal(isQuote({ ...validQuote, id: Number.NaN }), false);
  assert.equal(isQuote({ ...validQuote, language: "zh" }), false);
  assert.equal(isQuote({ ...validQuote, source: "" }), false);
  assert.equal(isQuote({ ...validQuote, subcategory: "FRIENDSHIP" }), false);
  assert.equal(isQuote({ ...validQuote, categories: ["LOVE"] }), false);
  assert.equal(isQuote(null), false);
  assert.equal(isQuote([]), false);
});

test("bundled quote snapshots cannot mutate the in-memory catalog", () => {
  const firstRead = getAllQuotes();
  const originalLength = firstRead.length;
  const originalCategory = firstRead[0]?.categories[0];

  firstRead.pop();
  assert.equal(getAllQuotes().length, originalLength);
  assert.equal(Object.isFrozen(getAllQuotes()[0]), true);
  assert.equal(Object.isFrozen(getAllQuotes()[0]?.categories), true);
  assert.equal(getAllQuotes()[0]?.categories[0], originalCategory);
});

test("ID lookup preserves the distinction between numeric and string IDs", () => {
  assert.ok(getQuoteById(1));
  assert.equal(getQuoteById("1"), undefined);
  assert.equal(getQuoteById("does-not-exist"), undefined);
});

test("category filtering returns matches and safely falls back for invalid input", () => {
  const wisdom = getQuotesByCategories(["WISDOM"]);
  assert.ok(wisdom.length > 0);
  assert.ok(wisdom.every((quote) => quote.primary_category === "WISDOM"));

  const all = getAllQuotes();
  assert.equal(getQuotesByCategories([]).length, all.length);
  assert.equal(
    getQuotesByCategories(["NOT_A_CATEGORY" as "WISDOM"]).length,
    all.length,
  );
});
