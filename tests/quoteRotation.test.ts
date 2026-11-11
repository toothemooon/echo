import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES } from "../src/constants/categories";
import { BUILT_IN_QUOTES } from "../src/data/quotes";
import { quoteKey } from "../src/recommendation/exposure";
import { clearLocalData } from "../src/storage/clearLocalData";
import {
  commitQuoteSelection,
  InvalidRecommendationStateError,
  prepareNextRecommendedQuote,
  type RecommendationStateV2,
  type RecommendationStorage,
} from "../src/storage/quoteRotation";
import { waitForStorageMutations } from "../src/storage/storageMutationQueue";

const SNAPSHOT_KEY = "@echo/recommendation_state_v2";
const LEGACY_ROTATION_KEY = "@echo/quote_rotation_v1";
const LEGACY_EXPOSURE_PREFIX = "@echo/quote_exposure_v1:";

class MemoryStorage implements RecommendationStorage {
  readonly values = new Map<string, string>();
  snapshotWritesToFail = 0;

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (key === SNAPSHOT_KEY && this.snapshotWritesToFail > 0) {
      this.snapshotWritesToFail -= 1;
      throw new Error("snapshot write failed");
    }
    this.values.set(key, value);
  }

  async getAllKeys(): Promise<string[]> {
    return [...this.values.keys()];
  }

  async multiRemove(keys: readonly string[]): Promise<void> {
    for (const key of keys) this.values.delete(key);
  }
}

function currentLocalDate(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function emptyRotation() {
  return {
    date: currentLocalDate(),
    shownQuoteIds: [],
    shownAuthorIds: [],
    categoryCounts: {},
    subcategoryCounts: {},
    languageCounts: {},
  };
}

function totalExposureCount(state: RecommendationStateV2): number {
  return Object.values(state.exposures)
    .flatMap((counts) => Object.values(counts ?? {}))
    .reduce((total, count) => total + count, 0);
}

test("prepare is read-only and duplicate commits count a quote once", async () => {
  await waitForStorageMutations();
  const storage = new MemoryStorage();
  const selection = await prepareNextRecommendedQuote(
    [...CATEGORIES],
    [],
    "en",
    7,
    storage,
  );

  assert.ok(selection);
  const preparedState = JSON.parse(
    (await storage.getItem(SNAPSHOT_KEY))!,
  ) as RecommendationStateV2;
  assert.deepEqual(preparedState.rotation.categoryCounts, {});
  assert.deepEqual(preparedState.exposures, { en: {}, "zh-Hans": {}, ja: {} });
  assert.equal(selection.generation, 7);
  assert.equal(selection.epoch, 0);

  assert.equal(await commitQuoteSelection(selection, storage), "committed");
  assert.equal(await commitQuoteSelection(selection, storage), "duplicate");

  const committedState = JSON.parse(
    (await storage.getItem(SNAPSHOT_KEY))!,
  ) as RecommendationStateV2;
  const quoteExposureKey = `${typeof selection.quote.id}:${String(selection.quote.id)}`;
  assert.equal(committedState.exposures.en?.[quoteExposureKey], 1);
  assert.equal(committedState.rotation.categoryCounts[selection.quote.primary_category], 1);
  assert.deepEqual(committedState.rotation.shownQuoteIds, [selection.quote.id]);
});

test("concurrent commits preserve both exposure increments", async () => {
  await waitForStorageMutations();
  const storage = new MemoryStorage();
  const first = await prepareNextRecommendedQuote(
    [...CATEGORIES],
    [],
    "en",
    3,
    storage,
  );
  assert.ok(first);

  const second = await prepareNextRecommendedQuote(
    [...CATEGORIES],
    [first.quote],
    "en",
    3,
    storage,
  );
  assert.ok(second);
  assert.notEqual(second.quote.id, first.quote.id);

  const results = await Promise.all([
    commitQuoteSelection(first, storage),
    commitQuoteSelection(second, storage),
  ]);
  assert.deepEqual(results, ["committed", "committed"]);

  const state = JSON.parse(
    (await storage.getItem(SNAPSHOT_KEY))!,
  ) as RecommendationStateV2;
  assert.equal(totalExposureCount(state), 2);
  assert.equal(state.rotation.shownQuoteIds.length, 2);
});

test("Clear All advances epoch and rejects a previously prepared selection", async () => {
  await waitForStorageMutations();
  const storage = new MemoryStorage();
  const selection = await prepareNextRecommendedQuote(
    [...CATEGORIES],
    [],
    "en",
    0,
    storage,
  );
  assert.ok(selection);

  const [clearResult, commitResult] = await Promise.all([
    clearLocalData(storage),
    commitQuoteSelection(selection, storage),
  ]);
  assert.equal(clearResult, undefined);
  assert.equal(commitResult, "stale");
  const state = JSON.parse(
    (await storage.getItem(SNAPSHOT_KEY))!,
  ) as RecommendationStateV2;
  assert.equal(state.epoch, 1);
  assert.deepEqual(state.rotation.categoryCounts, {});
  assert.deepEqual(state.exposures, { en: {}, "zh-Hans": {}, ja: {} });
});

test("an existing v2 snapshot wins over residual legacy keys", async () => {
  await waitForStorageMutations();
  const storage = new MemoryStorage();
  const quote = BUILT_IN_QUOTES[0]!;
  const exposureKey = quoteKey(quote.id);
  const v2: RecommendationStateV2 = {
    schemaVersion: 2,
    epoch: 4,
    rotation: {
      ...emptyRotation(),
      categoryCounts: { WISDOM: 3 },
      shownQuoteIds: [quote.id],
    },
    exposures: { en: { [exposureKey]: 5 }, "zh-Hans": {}, ja: {} },
  };
  const rawV2 = JSON.stringify(v2);
  storage.values.set(SNAPSHOT_KEY, rawV2);
  storage.values.set(
    LEGACY_ROTATION_KEY,
    JSON.stringify({ ...emptyRotation(), categoryCounts: { WISDOM: 99 } }),
  );
  storage.values.set(`${LEGACY_EXPOSURE_PREFIX}en`, JSON.stringify({ [exposureKey]: 99 }));

  const selection = await prepareNextRecommendedQuote(
    [...CATEGORIES],
    [],
    "en",
    1,
    storage,
  );

  assert.ok(selection);
  const after = JSON.parse((await storage.getItem(SNAPSHOT_KEY))!) as RecommendationStateV2;
  assert.equal(after.epoch, 4);
  assert.equal(after.rotation.categoryCounts.WISDOM, 3);
  assert.equal(after.exposures.en?.[exposureKey], 5);
  assert.equal(await storage.getItem(LEGACY_ROTATION_KEY), null);
  assert.equal(await storage.getItem(`${LEGACY_EXPOSURE_PREFIX}en`), null);
});

test("failed migration falls back to legacy reads without deleting legacy keys", async () => {
  await waitForStorageMutations();
  const storage = new MemoryStorage();
  storage.values.set(LEGACY_ROTATION_KEY, JSON.stringify(emptyRotation()));
  storage.values.set(`${LEGACY_EXPOSURE_PREFIX}en`, JSON.stringify({}));
  storage.snapshotWritesToFail = 1;

  const selection = await prepareNextRecommendedQuote(
    [...CATEGORIES],
    [],
    "en",
    0,
    storage,
  );

  assert.ok(selection);
  assert.equal(await storage.getItem(SNAPSHOT_KEY), null);
  assert.notEqual(await storage.getItem(LEGACY_ROTATION_KEY), null);
  assert.notEqual(await storage.getItem(`${LEGACY_EXPOSURE_PREFIX}en`), null);

  const recoveredSelection = await prepareNextRecommendedQuote(
    [...CATEGORIES],
    [],
    "en",
    1,
    storage,
  );
  assert.ok(recoveredSelection);
  assert.notEqual(await storage.getItem(SNAPSHOT_KEY), null);
  assert.equal(await storage.getItem(LEGACY_ROTATION_KEY), null);
  assert.equal(await storage.getItem(`${LEGACY_EXPOSURE_PREFIX}en`), null);
});

test("an invalid existing v2 snapshot is not replaced by legacy data", async () => {
  await waitForStorageMutations();
  const storage = new MemoryStorage();
  const invalidV2 = JSON.stringify({
    schemaVersion: 2,
    epoch: 2,
    rotation: null,
    exposures: { en: {}, "zh-Hans": {}, ja: {} },
  });
  storage.values.set(SNAPSHOT_KEY, invalidV2);
  storage.values.set(LEGACY_ROTATION_KEY, JSON.stringify(emptyRotation()));

  await assert.rejects(
    prepareNextRecommendedQuote([...CATEGORIES], [], "en", 0, storage),
    InvalidRecommendationStateError,
  );
  assert.equal(await storage.getItem(SNAPSHOT_KEY), invalidV2);
  assert.notEqual(await storage.getItem(LEGACY_ROTATION_KEY), null);
});
