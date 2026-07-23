import test from "node:test";
import assert from "node:assert/strict";
import { COLORS, HIGH_CONTRAST_COLORS } from "../src/constants/colors";

function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(background: string, foreground: string): number {
  const backgroundLuminance = relativeLuminance(background);
  const foregroundLuminance = relativeLuminance(foreground);
  return (
    (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) /
    (Math.min(backgroundLuminance, foregroundLuminance) + 0.05)
  );
}

test("reader-facing theme colors meet WCAG AA contrast against the page", () => {
  for (const [name, palette] of Object.entries(COLORS)) {
    for (const token of ["text", "author", "label", "btnIcon", "menuIcon", "roleText"] as const) {
      assert.ok(
        contrastRatio(palette.background, palette[token]) >= 4.5,
        `${name}.${token} does not meet 4.5:1 contrast`,
      );
    }
  }
});

test("high-contrast palettes are never weaker than their base themes", () => {
  for (const name of ["light", "dark", "archive"] as const) {
    const base = COLORS[name];
    const enhanced = HIGH_CONTRAST_COLORS[name];
    for (const token of ["text", "author", "label", "btnIcon", "roleText"] as const) {
      assert.ok(
        contrastRatio(enhanced.background, enhanced[token]) >=
          contrastRatio(base.background, base[token]),
        `${name}.${token} became weaker in high-contrast mode`,
      );
    }
  }
});
