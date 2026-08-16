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

  async multiRemove(keys: readonly string[]): Promise<void> {
    for (const key of keys) this.values.delete(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}

test("Clear All waits for an unfinished write and removes the key it creates", async () => {
  await waitForStorageMutations();
  const storage = new MemoryStorage();
  storage.values.set("@echo/theme", "dark");
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
  assert.deepEqual(
    [...storage.values.keys()].filter((key) => key.startsWith("@echo/")),
    [],
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
