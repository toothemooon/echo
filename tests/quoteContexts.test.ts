import test from "node:test";
import assert from "node:assert/strict";
import contextJson from "../QUOTE_CONTEXTS.json";
import { getAllQuotes } from "../src/data/quotes";

const allowedVerificationStatuses = new Set([
  "pending",
  "verified",
  "needs_context",
  "unverified",
  "disputed",
  "verified_composite",
]);
const allowedContentStatuses = new Set([
  "attribution_only",
  "secondary_only",
  "source_only",
  "verified",
]);

test("all 6,000 quotes have one structurally valid context", () => {
  const quoteIds = getAllQuotes().map((quote) => String(quote.id));
  const contextIds = contextJson.quote_contexts.map((context) =>
    String(context.quote_id),
  );

  assert.equal(contextIds.length, 6000);
  assert.equal(new Set(contextIds).size, contextIds.length);
  assert.deepEqual(new Set(contextIds), new Set(quoteIds));

  const authorRefs = new Set(
    contextJson.authors.map((author) => author.author_ref),
  );

  for (const author of contextJson.authors) {
    assert.ok(author.biography.trim().length > 0);
    assert.equal(author.biography_content_status, "editorial_profile");
    assert.doesNotMatch(
      author.biography,
      /identified in the current ECHO catalog|完整生平尚待|本調査ファイル/,
    );
    assert.ok(author.editorial_note.trim().length > 0);
    assert.equal(author.editorial_note_kind, "interpretive_commentary");
  }

  for (const context of contextJson.quote_contexts) {
    assert.ok(authorRefs.has(context.author_ref));
    assert.ok(context.context_summary.trim().length > 0);
    assert.ok(context.editorial_note.trim().length > 0);
    assert.equal(context.editorial_note_kind, "interpretive_commentary");
    assert.doesNotMatch(
      context.editorial_note,
      /unverified|not verified|verification|未确认|尚待核实|未確認|確認状況/i,
    );
    assert.ok(allowedVerificationStatuses.has(context.verification_status));
    assert.ok(allowedContentStatuses.has(context.context_content_status));

    if (context.context_content_status === "verified") {
      assert.ok(context.context_sources.length > 0);
    }

    if (
      context.verification_status === "unverified" ||
      context.verification_status === "disputed"
    ) {
      assert.ok(context.context_sources.length > 0);
    }

    if (context.context_content_status === "attribution_only") {
      assert.notEqual(context.verification_status, "verified_composite");
    }
  }
});
