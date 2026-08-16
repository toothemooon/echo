import test from "node:test";
import assert from "node:assert/strict";
import type { Quote } from "../src/data/quotes";
import {
  recordSelection,
  selectNextQuote,
  type RotationState,
} from "../src/recommendation/selector";
import { recordExposure } from "../src/recommendation/exposure";

function quote(
  id: number,
  author: string,
  category: "WISDOM" | "LOVE",
  subcategory: "TRUTH" | "PERSPECTIVE" | "FRIENDSHIP",
): Quote {
  return {
    id,
    text: `Quote ${id}`,
    language: id % 2 === 0 ? "zh-Hans" : "en",
    author_id: author,
    author,
    role: "Test identity",
    primary_category: category,
    subcategory,
    categories: [category],
  };
}

const emptyRotation: RotationState = {
  date: "2026-07-23",
  shownQuoteIds: [],
  shownAuthorIds: [],
  categoryCounts: {},
  subcategoryCounts: {},
  languageCounts: {},
};

test("selector excludes the previous five authors", () => {
  const recent = [
    quote(1, "a", "WISDOM", "TRUTH"),
    quote(2, "b", "WISDOM", "TRUTH"),
  ];
  const selected = selectNextQuote(
    [...recent, quote(3, "c", "WISDOM", "PERSPECTIVE")],
    {
      preferredCategories: ["WISDOM"],
      recentQuotes: recent,
      rotation: emptyRotation,
      exposure: {},
      random: () => 0,
    },
  );
  assert.equal(selected?.id, 3);
});

test("selector favors the least-used category and subcategory", () => {
  const selected = selectNextQuote(
    [
      quote(1, "a", "WISDOM", "TRUTH"),
      quote(2, "b", "WISDOM", "PERSPECTIVE"),
      quote(3, "c", "LOVE", "FRIENDSHIP"),
    ],
    {
      preferredCategories: ["WISDOM", "LOVE"],
      recentQuotes: [],
      rotation: {
        ...emptyRotation,
        categoryCounts: { WISDOM: 2, LOVE: 0 },
        subcategoryCounts: { "WISDOM/TRUTH": 2, "WISDOM/PERSPECTIVE": 0 },
      },
      exposure: {},
      random: () => 0,
    },
  );
  assert.equal(selected?.primary_category, "LOVE");
});

test("recordSelection persists daily uniqueness and balance counters", () => {
  const selected = quote(9, "author_9", "WISDOM", "TRUTH");
  const next = recordSelection(emptyRotation, selected);
  assert.deepEqual(next.shownQuoteIds, [9]);
  assert.deepEqual(next.shownAuthorIds, ["author_9"]);
  assert.equal(next.categoryCounts.WISDOM, 1);
  assert.equal(next.subcategoryCounts["WISDOM/TRUTH"], 1);
  assert.equal(next.languageCounts.en, 1);
});

test("selector balances three languages inside an equally eligible pool", () => {
  const english = quote(1, "author_en", "WISDOM", "TRUTH");
  const chinese = {
    ...quote(2, "author_zh", "WISDOM", "TRUTH"),
    language: "zh-Hans" as const,
  };
  const japanese = {
    ...quote(3, "author_ja", "WISDOM", "TRUTH"),
    language: "ja" as const,
  };
  const selected = selectNextQuote([english, chinese, japanese], {
    preferredCategories: ["WISDOM"],
    recentQuotes: [],
    rotation: {
      ...emptyRotation,
      languageCounts: { en: 3, "zh-Hans": 2, ja: 0 },
    },
    exposure: {},
    random: () => 0,
  });
  assert.equal(selected?.language, "ja");
});

test("selector only returns quotes from the selected language", () => {
  const english = {
    ...quote(1, "author_en", "WISDOM", "TRUTH"),
    language: "en" as const,
  };
  const chinese = {
    ...quote(2, "author_zh", "WISDOM", "TRUTH"),
    language: "zh-Hans" as const,
  };
  const japanese = {
    ...quote(3, "author_ja", "WISDOM", "TRUTH"),
    language: "ja" as const,
  };

  const selected = selectNextQuote([english, chinese, japanese], {
    preferredCategories: ["WISDOM"],
    recentQuotes: [],
    rotation: emptyRotation,
    exposure: {},
    language: "ja",
    random: () => 0,
  });

  assert.equal(selected?.language, "ja");
  assert.equal(selected?.id, 3);
});

test("selector still serves a quote after the session exhausts its eligible pool", () => {
  const onlyQuote = {
    ...quote(1, "author_en", "WISDOM", "TRUTH"),
    language: "en" as const,
  };
  const selected = selectNextQuote([onlyQuote], {
    preferredCategories: ["WISDOM"],
    recentQuotes: [onlyQuote],
    rotation: {
      ...emptyRotation,
      shownQuoteIds: [onlyQuote.id],
      shownAuthorIds: [onlyQuote.author_id],
    },
    exposure: {},
    language: "en",
    random: () => 0,
  });
  // Exhausting the session must not dead-end the Next action: the final
  // fallback reopens the preferred pool instead of returning null.
  assert.equal(selected?.id, onlyQuote.id);
});

test("the exhausted-session fallback avoids the immediately previous quote and author", () => {
  const first = {
    ...quote(1, "author_a", "WISDOM", "TRUTH"),
    language: "en" as const,
  };
  const second = {
    ...quote(2, "author_b", "WISDOM", "TRUTH"),
    language: "en" as const,
  };
  const selected = selectNextQuote([first, second], {
    preferredCategories: ["WISDOM"],
    recentQuotes: [first, second],
    rotation: {
      ...emptyRotation,
      shownQuoteIds: [first.id, second.id],
      shownAuthorIds: [first.author_id, second.author_id],
    },
    exposure: {},
    language: "en",
    random: () => 0,
  });
  // `second` was the last quote shown; the fallback must hand back `first`
  // rather than repeating the current card.
  assert.equal(selected?.id, first.id);
});

test("daily history can be reused after a restart when the session is empty", () => {
  const onlyQuote = {
    ...quote(1, "author_en", "WISDOM", "TRUTH"),
    language: "en" as const,
  };
  const selected = selectNextQuote([onlyQuote], {
    preferredCategories: ["WISDOM"],
    recentQuotes: [],
    rotation: {
      ...emptyRotation,
      shownQuoteIds: [onlyQuote.id],
      shownAuthorIds: [onlyQuote.author_id],
    },
    exposure: {},
    language: "en",
    random: () => 0,
  });
  assert.equal(selected?.id, onlyQuote.id);
});

test("selector serves unread quotes before ones already read", () => {
  const read = { ...quote(1, "a", "WISDOM", "TRUTH"), language: "en" as const };
  const unread = {
    ...quote(3, "c", "WISDOM", "TRUTH"),
    language: "en" as const,
  };

  const selected = selectNextQuote([read, unread], {
    preferredCategories: ["WISDOM"],
    recentQuotes: [],
    rotation: emptyRotation,
    exposure: { "number:1": 1 },
    language: "en",
    random: () => 0,
  });

  assert.equal(selected?.id, unread.id);
});

test("the pool reopens for a second sweep once every quote has been read", () => {
  const first = { ...quote(1, "a", "WISDOM", "TRUTH"), language: "en" as const };
  const second = {
    ...quote(3, "c", "WISDOM", "TRUTH"),
    language: "en" as const,
  };

  const selected = selectNextQuote([first, second], {
    preferredCategories: ["WISDOM"],
    recentQuotes: [],
    rotation: emptyRotation,
    exposure: { "number:1": 1, "number:3": 1 },
    language: "en",
    random: () => 0,
  });

  assert.notEqual(selected, null);
});

test("recordExposure returns a new object and leaves its input untouched", () => {
  const before = { "number:1": 2 };
  const after = recordExposure(before, quote(1, "a", "WISDOM", "TRUTH"));

  assert.deepEqual(before, { "number:1": 2 });
  assert.equal(after["number:1"], 3);
});
