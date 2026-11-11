import test from "node:test";
import assert from "node:assert/strict";
import { releaseBusyForCurrentRequest } from "../src/utils/requestSequence";

test("a late failed request cannot release the current request's busy lock", async () => {
  let busy = true;
  let released: boolean | undefined;
  await Promise.reject(new Error("old request failed"))
    .catch(() => undefined)
    .finally(() => {
      released = releaseBusyForCurrentRequest(1, 2, () => {
        busy = false;
      });
    });

  assert.equal(released, false);
  assert.equal(busy, true);
});

test("the current request releases its own busy lock", () => {
  let busy = true;
  const released = releaseBusyForCurrentRequest(2, 2, () => {
    busy = false;
  });

  assert.equal(released, true);
  assert.equal(busy, false);
});
