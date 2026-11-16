import test from "node:test";
import assert from "node:assert/strict";
import {
  richTextToPlainText,
  sanitizeRichText,
} from "./richText.service.js";

test("rich text sanitizer", async (t) => {
  await t.test("preserves supported formatting", () => {
    assert.equal(
      sanitizeRichText("<p>Un <strong>texte</strong></p><ul><li>élément</li></ul>"),
      "<p>Un <strong>texte</strong></p><ul><li>élément</li></ul>",
    );
    assert.equal(sanitizeRichText("<div>Une ligne</div>"), "<div>Une ligne</div>");
  });

  await t.test("removes scripts, event handlers, and unsafe links", () => {
    const result = sanitizeRichText(
      '<p onclick="alert(1)">Texte</p><script>alert(1)</script><a href="javascript:alert(1)">lien</a>',
    );
    assert.equal(result.includes("onclick"), false);
    assert.equal(result.includes("<script"), false);
    assert.equal(result.includes("javascript:"), false);
    assert.match(result, /<p>Texte<\/p>/);
  });

  await t.test("extracts searchable text from formatted values", () => {
    assert.equal(
      richTextToPlainText("<h2>Bon</h2><p> produit</p>"),
      "Bon produit",
    );
  });
});
