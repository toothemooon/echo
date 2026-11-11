import test from "node:test";
import assert from "node:assert/strict";
import { clearLocalData } from "../src/storage/clearLocalData";
import {
  enqueueStorageMutation,
  waitForStorageMutations,
} from "../src/storage/storageMutationQueue";

class MemoryStorage {
  readonly values = new Map<string, string>();

  async getAllKeys(): Promise<string[]> {
    return [...this.values.keys()];
  }

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async multiRemove(keys: readonly string[]): Promise<void> {
    for (const key of keys) this.values.delete(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}

test("Clear All waits for writes and retains an incremented recommendation epoch", async () => {
  await waitForStorageMutations();
  const storage = new MemoryStorage();
  storage.values.set("@echo/theme", "dark");
  storage.values.set(
    "@echo/recommendation_state_v2",
    JSON.stringify({
      schemaVersion: 2,
      epoch: 3,
      rotation: { date: "2026-11-11", shownQuoteIds: [] },
      exposures: { en: {}, "zh-Hans": {}, ja: {} },
    }),
  );
  storage.values.set("third-party/key", "keep");

  let releaseWrite!: () => void;
  const writeGate = new Promise<void>((resolve) => {
    releaseWrite = resolve;
  });
  const pendingWrite = enqueueStorageMutation(async () => {
    await writeGate;
    await storage.setItem("@echo/saved_quotes", "[]");
  });

  let clearCompleted = false;
  const pendingClear = clearLocalData(storage).then(() => {
    clearCompleted = true;
  });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(clearCompleted, false);

  releaseWrite();
  await Promise.all([pendingWrite, pendingClear]);
  const retained = JSON.parse(
    storage.values.get("@echo/recommendation_state_v2")!,
  ) as { schemaVersion: number; epoch: number; rotation: { categoryCounts: object }; exposures: object };
  assert.equal(retained.schemaVersion, 2);
  assert.equal(retained.epoch, 4);
  assert.deepEqual(retained.rotation.categoryCounts, {});
  assert.deepEqual(retained.exposures, { en: {}, "zh-Hans": {}, ja: {} });
  assert.deepEqual(
    [...storage.values.keys()].filter((key) => key.startsWith("@echo/")),
    ["@echo/recommendation_state_v2"],
  );
  assert.equal(storage.values.get("third-party/key"), "keep");
});

test("a rejected storage mutation does not poison the global queue", async () => {
  await assert.rejects(
    enqueueStorageMutation(async () => {
      throw new Error("write failed");
    }),
    /write failed/,
  );

  let ran = false;
  await enqueueStorageMutation(async () => {
    ran = true;
  });
  assert.equal(ran, true);
});
