import test from "node:test";
import assert from "node:assert/strict";
import type { Quote } from "../src/data/quotes";
import {
  recordSelection,
  selectNextQuote,
  type RotationState,
} from "../src/recommendation/selector";

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
    language: "ja",
    random: () => 0,
  });

  assert.equal(selected?.language, "ja");
  assert.equal(selected?.id, 3);
});

test("selector returns null after the current session exhausts its eligible pool", () => {
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
    language: "en",
    random: () => 0,
  });
  assert.equal(selected, null);
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
    language: "en",
    random: () => 0,
  });
  assert.equal(selected?.id, onlyQuote.id);
});
