import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_THEME_COLORS,
  normalizeThemeColors,
  parseThemeColorsPayload,
} from "./settings.service.js";

test("theme colors", async (t) => {
  await t.test("uses the default palette for missing values", () => {
    assert.deepEqual(normalizeThemeColors(undefined), DEFAULT_THEME_COLORS);
  });

  await t.test("normalizes valid colors and preserves missing defaults", () => {
    assert.deepEqual(
      normalizeThemeColors({ storefrontPrimary: "#12AbEF" }),
      { storefrontPrimary: "#12abef", adminPrimary: "#820b0b" },
    );
  });

  await t.test("accepts a partial color update", () => {
    assert.deepEqual(parseThemeColorsPayload({ adminPrimary: "#ABCDEF" }), {
      adminPrimary: "#abcdef",
    });
  });

  await t.test("rejects malformed color values", () => {
    assert.throws(
      () => parseThemeColorsPayload({ storefrontPrimary: "red" }),
      { status: 400 },
    );
  });

  await t.test("rejects unknown theme color keys", () => {
    assert.throws(
      () => parseThemeColorsPayload({ background: "#ffffff" }),
      { status: 400 },
    );
  });
});
