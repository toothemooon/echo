import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, type Category } from "../src/constants/categories";
import {
  BUILT_IN_QUOTES,
  type Quote,
  type QuoteLanguage,
} from "../src/data/quotes";
import {
  normalizeExposureCounts,
  recordExposure,
  quoteKey,
  seedExposureFromViewed,
  type ExposureCounts,
} from "../src/recommendation/exposure";
import {
  recordSelection,
  selectNextQuote,
  type RotationState,
} from "../src/recommendation/selector";

/** Reproducible PRNG so coverage assertions do not flake. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function emptyRotation(day: number): RotationState {
  return {
    date: `2026-01-${String(day).padStart(2, "0")}`,
    shownQuoteIds: [],
    shownAuthorIds: [],
    categoryCounts: {},
    subcategoryCounts: {},
    languageCounts: {},
  };
}

type SimulationResult = {
  poolSize: number;
  draws: number;
  unique: number;
  coverage: number;
  maxShows: number;
  minShows: number;
};

/**
 * Drives the real selector the way the app does: rotation and the in-memory
 * session both reset every day, so only the persisted exposure counts carry
 * memory across days.
 */
function simulate(options: {
  language: QuoteLanguage;
  categories: Category[];
  days: number;
  perDay: number;
  seed: number;
}): SimulationResult {
  const random = mulberry32(options.seed);
  const preferred = new Set(options.categories);
  const pool = BUILT_IN_QUOTES.filter(
    (quote) =>
      quote.language === options.language &&
      preferred.has(quote.primary_category),
  );

  let exposure: ExposureCounts = {};
  const shows = new Map<string, number>();
  let draws = 0;

  for (let day = 1; day <= options.days; day += 1) {
    let rotation = emptyRotation((day % 28) + 1);
    const session: Quote[] = [];

    for (let index = 0; index < options.perDay; index += 1) {
      const selected = selectNextQuote(pool, {
        preferredCategories: options.categories,
        recentQuotes: session,
        rotation,
        exposure,
        language: options.language,
        random,
      });
      if (!selected) break;

      exposure = recordExposure(exposure, selected);
      rotation = recordSelection(rotation, selected);
      session.push(selected);
      draws += 1;

      const key = quoteKey(selected.id);
      shows.set(key, (shows.get(key) ?? 0) + 1);
    }
  }

  const counts = pool.map((quote) => shows.get(quoteKey(quote.id)) ?? 0);
  return {
    poolSize: pool.length,
    draws,
    unique: shows.size,
    coverage: shows.size / pool.length,
    maxShows: Math.max(...counts),
    minShows: Math.min(...counts),
  };
}

test("a reader sees no repeats across the first 90 days", () => {
  const result = simulate({
    language: "en",
    categories: [...CATEGORIES],
    days: 90,
    perDay: 10,
    seed: 7,
  });

  assert.equal(result.draws, 900);
  assert.ok(
    result.unique >= 890,
    `expected >= 890 unique quotes in 900 draws, got ${result.unique}`,
  );
  assert.ok(
    result.maxShows <= 2,
    `expected no quote shown more than twice, got ${result.maxShows}`,
  );
});

test("the preferred pool is nearly covered after 200 days", () => {
  const result = simulate({
    language: "en",
    categories: [...CATEGORIES],
    days: 200,
    perDay: 10,
    seed: 7,
  });

  // The pre-fix algorithm scored roughly 0.50 here, and 0.335 at 90 days.
  assert.ok(
    result.coverage >= 0.95,
    `expected >= 95% coverage of ${result.poolSize} quotes, got ${(
      result.coverage * 100
    ).toFixed(1)}%`,
  );
});

test("the preferred pool is fully covered within a year", () => {
  const result = simulate({
    language: "en",
    categories: [...CATEGORIES],
    days: 365,
    perDay: 10,
    seed: 7,
  });

  assert.ok(
    result.coverage >= 0.98,
    `expected >= 98% coverage, got ${(result.coverage * 100).toFixed(1)}%`,
  );
});

test("a narrow two-category preference is covered just as evenly", () => {
  const result = simulate({
    language: "en",
    categories: ["MINDFULNESS", "WISDOM"],
    days: 200,
    perDay: 10,
    seed: 11,
  });

  assert.ok(
    result.coverage >= 0.95,
    `expected >= 95% coverage of ${result.poolSize} quotes, got ${(
      result.coverage * 100
    ).toFixed(1)}%`,
  );
});

test("a tiny pool cycles evenly instead of fixating on a few quotes", () => {
  const result = simulate({
    language: "zh-Hans",
    categories: ["MINDFULNESS", "HEALING"],
    days: 90,
    perDay: 10,
    seed: 3,
  });

  assert.equal(result.coverage, 1);
  assert.ok(
    result.maxShows - result.minShows <= 1,
    `expected an even cycle, got ${result.minShows}..${result.maxShows} shows`,
  );
});

test("normalizeExposureCounts drops unusable entries and unknown ids", () => {
  const known = quoteKey(BUILT_IN_QUOTES[0]!.id);

  assert.deepEqual(normalizeExposureCounts({ [known]: 2 }), { [known]: 2 });
  assert.deepEqual(normalizeExposureCounts({ [known]: 0 }), {});
  assert.deepEqual(normalizeExposureCounts({ [known]: -1 }), {});
  assert.deepEqual(normalizeExposureCounts({ [known]: 1.5 }), {});
  assert.deepEqual(normalizeExposureCounts({ [known]: Number.NaN }), {});
  assert.deepEqual(normalizeExposureCounts({ [known]: "2" }), {});
  assert.deepEqual(normalizeExposureCounts({ "string:not-a-quote": 1 }), {});
  assert.deepEqual(normalizeExposureCounts({ malformed: 1 }), {});
  assert.deepEqual(normalizeExposureCounts(null), {});
  assert.deepEqual(normalizeExposureCounts([1, 2]), {});
  assert.deepEqual(normalizeExposureCounts("nope"), {});
});

test("seedExposureFromViewed marks quotes read without lowering a count", () => {
  const [first, second] = BUILT_IN_QUOTES;
  const firstKey = quoteKey(first!.id);
  const secondKey = quoteKey(second!.id);

  const seeded = seedExposureFromViewed({ [firstKey]: 3 }, [first!, second!]);

  assert.equal(seeded[firstKey], 3);
  assert.equal(seeded[secondKey], 1);
});
