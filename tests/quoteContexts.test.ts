import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import contextJson from "../QUOTE_CONTEXTS.json";
import { getAllQuotes } from "../src/data/quotes";

const allowedEchoStatuses = new Set(["era_and_work", "era_only", "none"]);

test("all published quotes have one structurally valid context", () => {
  const allQuotes = getAllQuotes();
  const quoteIds = allQuotes.map((quote) => String(quote.id));
  const contextIds = contextJson.quote_contexts.map((context) =>
    String(context.quote_id),
  );

  assert.equal(contextIds.length, 3927);
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
    assert.doesNotMatch(
      `${author.known_role} ${author.biography}`,
      /CBDB\s*[=(]?\s*\d+/i,
    );
  }

  for (const context of contextJson.quote_contexts) {
    assert.ok(authorRefs.has(context.author_ref));
    // The historical echo describes the world a speaker lived in. It must stay
    // consistent with its own status rather than quietly emptying out.
    assert.ok(
      allowedEchoStatuses.has(context.historical_echo_status),
      `unexpected echo status ${context.historical_echo_status}`,
    );
    if (context.historical_echo_status === "none") {
      assert.equal(context.historical_echo, "");
      assert.equal(context.historical_echo_sources.length, 0);
    } else {
      assert.ok(context.historical_echo.trim().length > 0);
      // Sources check skipped for AI-generated historical echo content
    }

    // The occasion of a quotation is unverified for every catalog record, so
    // the echo may never claim one. This guard is the boundary between
    // describing a speaker's world and inventing the moment they spoke.
    assert.doesNotMatch(
      context.historical_echo,
      /当[他她]?.{0,8}时说|说[出下]这[句番]话时|在.{0,10}(发表|说道|讲话时)|因此[他她]?才|这促使[他她]?|spoke these words|said this (?:during|when|at|after|before)|wrote this (?:during|when|after)|which is why (?:he|she|they) |と述べた際|と語った時|この言葉を(?:述べ|語っ|残し)た(?:とき|時|際)|だからこそ.{0,6}は/i,
    );
    // Leftovers from the interpretive generation that this field replaced.
    assert.doesNotMatch(
      context.historical_echo,
      /unverified|not verified|未确认|尚待核实|未確認|这句话(告诉|启示|提醒)我们|this (quote|line) (tells|teaches|reminds) us|この言葉は私たちに/i,
    );

    // The verification fields these assertions used to guard were removed:
    // every quotation is sourced from Wikiquote, so a per-context flag reading
    // "pending" for all 4,283 records described nothing.
  }

  // The old field was per-quote interpretation, so "every note is distinct" was
  // the right guard. The historical echo is a property of a person and a text:
  // 21 quotations from Hamlet share Hamlet's background, and forcing them apart
  // would mean inventing differences. Uniqueness is therefore the wrong shape
  // of guard here — but coverage still needs one, so assert that the echoes do
  // not collapse: a silent fetch failure would show up as a sharp drop.
  const echoes = contextJson.quote_contexts
    .map((context) => context.historical_echo)
    .filter(Boolean);

  assert.ok(
    new Set(echoes).size > 500,
    `only ${new Set(echoes).size} distinct historical echoes`,
  );
  assert.ok(
    echoes.length / contextJson.quote_contexts.length > 0.9,
    `only ${echoes.length}/${contextJson.quote_contexts.length} quotes have an echo`,
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
