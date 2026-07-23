import test from "node:test";
import assert from "node:assert/strict";
import type { Quote } from "../src/data/quotes";
import {
  formatQuoteShareText,
  getShareCopy,
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

test("share controls are localized for every quote language", () => {
  assert.equal(getShareCopy("en").image, "Share as Image");
  assert.equal(getShareCopy("zh-Hans").copied, "已复制");
  assert.equal(getShareCopy("ja").more, "その他の共有方法");
});
