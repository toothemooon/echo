import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

test("all published quotes have one structurally valid context", () => {
  const allQuotes = getAllQuotes();
  const quoteIds = allQuotes.map((quote) => String(quote.id));
  const contextIds = contextJson.quote_contexts.map((context) =>
    String(context.quote_id),
  );

  assert.equal(contextIds.length, 4283);
  assert.equal(new Set(contextIds).size, contextIds.length);
  for (const quoteId of quoteIds) {
    assert.ok(contextIds.includes(quoteId), `missing context for ${quoteId}`);
  }

  const authorRefs = new Set(
    contextJson.authors.map((author) => author.author_ref),
  );

  for (const author of contextJson.authors) {
    // An empty biography is a deliberate state: the catalog knows only the
    // one-line role, which the screen already prints under the name, so the
    // LIFE section is omitted rather than padded with a restatement of it.
    if (author.biography.trim().length === 0) {
      assert.equal(author.biography_content_status, "catalog_identity_only");
    } else {
      assert.ok(
        ["wikipedia_lead", "verified", "editorial_profile"].includes(
          author.biography_content_status,
        ),
        `unexpected status ${author.biography_content_status}`,
      );
    }

    // CC BY-SA requires attribution wherever the text is shown, so a Wikipedia
    // biography without a resolvable source must never ship.
    if (author.biography_content_status === "wikipedia_lead") {
      assert.ok(author.biography_sources.length > 0);
      assert.ok(author.biography_sources[0].title);
      assert.match(author.biography_sources[0].url, /^https:\/\/\w+\.wikipedia\.org\/wiki\//);
    }

    assert.doesNotMatch(
      author.biography,
      // "紹介されて" alone is ordinary Japanese ("…と紹介されている") and appears
      // in real Wikipedia prose; only the ECHO-referential form is boilerplate.
      /identified in the current ECHO catalog|presented in ECHO|在\s*ECHO|ECHOでは|ECHO.{0,8}紹介されて|完整生平尚待|本調査ファイル/i,
    );
    assert.ok(author.editorial_note.trim().length > 0);
    assert.equal(author.editorial_note_kind, "interpretive_commentary");
    assert.doesNotMatch(
      author.editorial_note,
      /presented in ECHO|在\s*ECHO|ECHOでは|ECHO.{0,8}紹介されて/i,
    );
    assert.doesNotMatch(
      `${author.known_role} ${author.biography}`,
      /CBDB\s*[=(]?\s*\d+/i,
    );
  }

  for (const context of contextJson.quote_contexts) {
    assert.ok(authorRefs.has(context.author_ref));
    assert.ok(context.context_summary.trim().length > 0);
    assert.ok(context.editorial_note.trim().length > 0);
    assert.equal(context.editorial_note_kind, "interpretive_commentary");
    assert.doesNotMatch(
      context.editorial_note,
      /unverified|not verified|verification|未确认|尚待核实|未確認|確認状況|現在記録されている|公共角色与个人表达|public role with a more personal voice|Its force comes from narrowing|複雑な説明を重ねず|留下.{0,8}(自身|个人|讀者|读者).{0,8}(经验|經驗|余地|空间|空間)|联系自身经验|让读者自行体会|留白.{0,8}(经历|經歷|经验|經驗)|leav(?:e|ing).{0,30}(reader|own experience|room)|room for the reader|個々の経験を重ねる余白|読者.{0,12}(余白|委ね)|这句话(告诉|启示|提醒)我们|這句話(告訴|啟示|提醒)我們|this (quote|line) (tells|teaches|reminds) us|この言葉は私たちに.{0,12}(教え|気づかせ|思い出させ)|通过.{0,8}(对比|排比|转折|句式)|借助.{0,8}(并列|节奏|修辞)|対比|並列とリズム|the (contrast|parallel|conditional movement|direct claim) in/i,
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

  assert.equal(
    new Set(contextJson.quote_contexts.map((context) => context.editorial_note))
      .size,
    contextJson.quote_contexts.length,
    "every quote should receive a distinct editorial reading",
  );

  for (const quote of allQuotes) {
    assert.doesNotMatch(quote.role, /CBDB\s*[=(]?\s*\d+/i);
  }
});

// A context is written about one exact wording. If the catalog text is edited
// afterwards, the fingerprint is the only thing that reveals the context now
// describes different words — so it must never be allowed to drift silently.
test("every context fingerprint matches its current quote text", () => {
  const quotesById = new Map(
    getAllQuotes().map((quote) => [String(quote.id), quote]),
  );

  for (const context of contextJson.quote_contexts) {
    const quote = quotesById.get(String(context.quote_id));
    assert.ok(quote, `no quote for context ${String(context.quote_id)}`);
    assert.equal(
      createHash("sha256").update(quote.text).digest("hex"),
      context.text_fingerprint,
      `stale fingerprint for ${String(context.quote_id)}`,
    );
  }
});
