import test from "node:test";
import assert from "node:assert/strict";
import {
  isFontReady,
  resolveRuntimeQuoteFont,
} from "../src/startup/fontFallback";

test("startup waits while the bundled font is still loading", () => {
  assert.equal(isFontReady(false, null), false);
});

test("startup proceeds when the bundled font loads", () => {
  assert.equal(isFontReady(true, null), true);
  assert.equal(resolveRuntimeQuoteFont("elegant", null), "elegant");
  assert.equal(resolveRuntimeQuoteFont("system", null), "system");
});

test("a font error proceeds with the system quote font", () => {
  const fontError = new Error("font unavailable");
  assert.equal(isFontReady(false, fontError), true);
  assert.equal(resolveRuntimeQuoteFont("elegant", fontError), "system");
});
