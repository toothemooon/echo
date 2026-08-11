import test from "node:test";
import assert from "node:assert/strict";
import { getAuthorContext, getQuoteContext } from "../src/data/quoteContexts";
import { getAllQuotes } from "../src/data/quotes";

test("context lookup normalizes numeric and string quote IDs", () => {
  const numeric = getQuoteContext(61);
  const numericAsString = getQuoteContext("61");
  const japanese = getQuoteContext("ja-wikiquote-2921-01");

  assert.ok(numeric);
  assert.equal(numericAsString?.context, numeric.context);
  assert.equal(japanese?.author?.display_name, "太田水穂");
  assert.equal(japanese.context.source_work, "つゆ艸");
  assert.equal(getQuoteContext("does-not-exist"), undefined);
});

// The profile screen resolves the author independently of the per-quote
// context, so a gap in quote_contexts can no longer blank out the whole page.
// This assertion does not read quote_contexts at all.
test("every published quote resolves an author profile without its context", () => {
  for (const quote of getAllQuotes()) {
    const author = getAuthorContext(quote.language, quote.author_id);

    assert.ok(author, `missing author profile for ${String(quote.id)}`);
    assert.ok(author.display_name.trim().length > 0);
  }
});

// Biographies come from Wikipedia and a handful of authors have no article, so
// full coverage is not achievable. Guard the level instead: a large drop means
// the fetch step silently failed rather than that the catalog changed.
test("the large majority of quotes show a real biography", () => {
  const quotes = getAllQuotes();
  const withBiography = quotes.filter((quote) =>
    getAuthorContext(quote.language, quote.author_id)?.biography.trim(),
  );

  assert.ok(
    withBiography.length / quotes.length > 0.9,
    `only ${withBiography.length}/${quotes.length} quotes have a biography`,
  );
});

test("a sourced context carries its source record", () => {
  const result = getQuoteContext("en-wikiquote-293-001");

  assert.ok(result);
  assert.equal(result.author?.display_name, "Ivo Andrić");
  assert.equal(result.context.context_content_status, "source_only");
  assert.equal(result.context.verification_status, "pending");
  assert.ok(result.context.context_sources.length > 0);
});

// ja-wikiquote-451-02 was a hand-verified "verified_composite" context. It was
// lost when QUOTE_CONTEXTS.json (untracked) was regenerated, and regeneration
// can only produce a "pending" entry — the fact-checking itself is not
// reproducible. Asserted as regenerated so the gap stays visible.
test("the Koizumi context exists but lost its verified composite status", () => {
  const result = getQuoteContext("ja-wikiquote-451-02");

  assert.ok(result);
  assert.equal(result.author?.display_name, "小泉純一郎");
  assert.equal(result.context.verification_status, "pending");
});

