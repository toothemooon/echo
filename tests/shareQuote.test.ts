import test from "node:test";
import assert from "node:assert/strict";
import type { Quote } from "../src/data/quotes";
import {
  buildTwitterShareUrl,
  buildWhatsAppShareUrl,
  formatQuoteShareText,
} from "../src/services/shareQuote";

function quote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: "share-test",
    text: "  神は完全終始無し  ",
    language: "ja",
    author_id: "onishi_hajime",
    author: "  大西 祝  ",
    role: "哲学者",
    primary_category: "WISDOM",
    subcategory: "PHILOSOPHY",
    categories: ["WISDOM"],
    ...overrides,
  };
}

test("share text is normalized and carries attribution and branding", () => {
  assert.equal(
    formatQuoteShareText(quote()),
    '"神は完全終始無し"\n— 大西 祝\n\nShared from Echo',
  );
});

test("Twitter URL safely encodes multilingual text and punctuation", () => {
  const url = buildTwitterShareUrl(
    quote({ text: '勇気 & "希望"', author: "作者 / Author" }),
  );
  const parsed = new URL(url);

  assert.equal(parsed.origin, "https://twitter.com");
  assert.equal(parsed.pathname, "/intent/tweet");
  assert.equal(
    parsed.searchParams.get("text"),
    '"勇気 & "希望""\n— 作者 / Author\n\nShared from Echo',
  );
});

test("WhatsApp URL safely encodes the same canonical share text", () => {
  const sample = quote({ text: "Love + patience", author: "A&B" });
  const url = buildWhatsAppShareUrl(sample);
  const encodedText = url.slice(url.indexOf("?text=") + 6);

  assert.equal(url.startsWith("whatsapp://send?text="), true);
  assert.equal(decodeURIComponent(encodedText), formatQuoteShareText(sample));
});
