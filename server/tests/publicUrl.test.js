import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getClientBaseUrl } from "../utils/publicUrl.js";

const originalClientUrl = process.env.CLIENT_URL;
const originalRenderUrl = process.env.RENDER_EXTERNAL_URL;

afterEach(() => {
  if (originalClientUrl === undefined) {
    delete process.env.CLIENT_URL;
  } else {
    process.env.CLIENT_URL = originalClientUrl;
  }

  if (originalRenderUrl === undefined) {
    delete process.env.RENDER_EXTERNAL_URL;
  } else {
    process.env.RENDER_EXTERNAL_URL = originalRenderUrl;
  }
});

describe("public client URL", () => {
  it("prefers the configured client URL and removes trailing slashes", () => {
    process.env.CLIENT_URL = "https://shop.example/";
    process.env.RENDER_EXTERNAL_URL = "https://service.onrender.com";

    assert.equal(getClientBaseUrl(), "https://shop.example");
  });

  it("uses Render's external URL when no client URL is configured", () => {
    delete process.env.CLIENT_URL;
    process.env.RENDER_EXTERNAL_URL = "https://service.onrender.com/";

    assert.equal(getClientBaseUrl(), "https://service.onrender.com");
  });

  it("reports a missing public URL instead of returning an invalid link", () => {
    delete process.env.CLIENT_URL;
    delete process.env.RENDER_EXTERNAL_URL;

    assert.throws(getClientBaseUrl, /CLIENT_URL ou RENDER_EXTERNAL_URL/);
  });
});
