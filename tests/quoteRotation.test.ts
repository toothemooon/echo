import test from "node:test";
import assert from "node:assert/strict";
import AsyncStorageModule from "@react-native-async-storage/async-storage";
import { CATEGORIES } from "../src/constants/categories";
import { getNextRecommendedQuote } from "../src/storage/quoteRotation";
import { waitForStorageMutations } from "../src/storage/storageMutationQueue";

type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

const storage = (
  AsyncStorageModule as unknown as StorageLike
).getItem
  ? (AsyncStorageModule as unknown as StorageLike)
  : (AsyncStorageModule as unknown as { default: StorageLike }).default;

test("recommendation resolves when AsyncStorage writes succeed", async () => {
  await waitForStorageMutations();

  const values = new Map<string, string>();
  const originalGetItem = storage.getItem;
  const originalSetItem = storage.setItem;

  storage.getItem = async (key) => values.get(key) ?? null;
  storage.setItem = async (key, value) => {
    values.set(key, value);
  };

  try {
    const timeout = Symbol("timeout");
    const result = await Promise.race([
      getNextRecommendedQuote([...CATEGORIES], [], "en"),
      new Promise<typeof timeout>((resolve) => {
        setTimeout(() => resolve(timeout), 250);
      }),
    ]);

    if (result === timeout) {
      assert.fail("recommendation did not resolve before the timeout");
    }

    assert.ok(result);
    assert.equal(result.language, "en");
    assert.ok(values.has("@echo/quote_rotation_v1"));
    assert.ok(values.has("@echo/quote_exposure_v1:en"));
  } finally {
    storage.getItem = originalGetItem;
    storage.setItem = originalSetItem;
  }
});
