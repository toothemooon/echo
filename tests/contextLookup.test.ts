import test from "node:test";
import assert from "node:assert/strict";
import { getQuoteContext } from "../src/data/quoteContexts";

test("context lookup normalizes numeric and string quote IDs", () => {
  const numeric = getQuoteContext(1);
  const numericAsString = getQuoteContext("1");
  const japanese = getQuoteContext("ja-wikiquote-2921-01");

  assert.ok(numeric);
  assert.equal(numericAsString?.context, numeric.context);
  assert.equal(japanese?.author?.display_name, "太田水穂");
  assert.equal(japanese.context.source_work, "つゆ艸");
  assert.equal(getQuoteContext("does-not-exist"), undefined);
});

test("the verified Koizumi composite context is available", () => {
  const result = getQuoteContext("ja-wikiquote-451-02");

  assert.ok(result);
  assert.equal(result.author?.display_name, "小泉純一郎");
  assert.equal(result.context.context_content_status, "verified");
  assert.equal(result.context.verification_status, "verified_composite");
  assert.ok(result.context.context_sources.length > 0);
});

