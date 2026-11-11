import test from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_SUPPORT_MIME_TYPES,
  parseSupportLocation,
  validateSupportMessagePayload,
} from "./supportMessage.service.js";

test("support message payload", async (t) => {
  await t.test("accepts text-only messages", () => {
    assert.deepEqual(validateSupportMessagePayload("  Bonjour  ", [], undefined), {
      text: "Bonjour",
    });
  });

  await t.test("accepts attachment-only and location-only messages", () => {
    assert.deepEqual(
      validateSupportMessagePayload("", [{}], undefined),
      { text: "" },
    );
    assert.deepEqual(
      validateSupportMessagePayload("", [], { latitude: 6, longitude: 2 }),
      { text: "" },
    );
  });

  await t.test("rejects empty messages", () => {
    assert.match(
      validateSupportMessagePayload("  ", [], undefined).error,
      /Ajoutez un texte/,
    );
  });

  await t.test("rejects oversized text", () => {
    assert.match(
      validateSupportMessagePayload("x".repeat(2001), [], undefined).error,
      /2000 caractères/,
    );
  });

  await t.test("allows only supported image and video types", () => {
    assert.equal(ALLOWED_SUPPORT_MIME_TYPES.has("image/png"), true);
    assert.equal(ALLOWED_SUPPORT_MIME_TYPES.has("video/mp4"), true);
    assert.equal(ALLOWED_SUPPORT_MIME_TYPES.has("application/pdf"), false);
  });

  await t.test("parses valid coordinates from multipart data", () => {
    assert.deepEqual(
      parseSupportLocation('{"latitude":6.37,"longitude":2.42,"accuracy":15}'),
      {
        location: { latitude: 6.37, longitude: 2.42, accuracy: 15 },
      },
    );
  });

  await t.test("rejects invalid coordinates", () => {
    assert.match(
      parseSupportLocation({ latitude: 91, longitude: 2 }).error,
      /coordonnées/,
    );
    assert.match(parseSupportLocation("{").error, /position.*invalide/i);
  });
});
