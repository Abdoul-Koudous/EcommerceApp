import test from "node:test";
import assert from "node:assert/strict";
import AboutPageModel from "./aboutPage.model.js";
import ContactPageModel from "./contactPage.model.js";
import HelpFaqModel from "./helpFaq.model.js";
import ProductModel from "./product.model.js";

test("rich text fields are sanitized when assigned to models", () => {
  const unsafeHtml = '<p onclick="run()">Texte <strong>important</strong></p><script>run()</script>';

  const product = new ProductModel({
    name: "Produit",
    description: unsafeHtml,
  });
  const faq = new HelpFaqModel({
    category: "Commandes",
    categoryIcon: "FaBox",
    categoryDescription: unsafeHtml,
    question: "Question ?",
    answer: unsafeHtml,
  });
  const about = new AboutPageModel({
    heroSubtitle: unsafeHtml,
    storyParagraphs: [unsafeHtml],
    values: [
      { icon: "FaBox", title: "Valeur", description: unsafeHtml },
    ],
  });
  const contact = new ContactPageModel({ heroSubtitle: unsafeHtml });

  for (const value of [
    product.description,
    faq.categoryDescription,
    faq.answer,
    about.heroSubtitle,
    about.storyParagraphs[0],
    about.values[0].description,
    contact.heroSubtitle,
  ]) {
    assert.equal(value.includes("onclick"), false);
    assert.equal(value.includes("<script"), false);
    assert.match(value, /<strong>important<\/strong>/);
  }
});
