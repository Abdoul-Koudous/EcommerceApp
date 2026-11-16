import mongoose from "mongoose";
import { sanitizeRichText } from "../services/richText.service.js";

const aboutPageSchema = new mongoose.Schema(
  {
    // HERO
    heroTag: { type: String, default: "À propos de nous" },
    heroTitle: { type: String, default: "" },
    heroSubtitle: { type: String, default: "", set: sanitizeRichText },
    heroImage: { type: String, default: "" }, // URL Cloudinary

    // STORY
    storyTag: { type: String, default: "Notre histoire" },
    storyTitle: { type: String, default: "" },
    storyParagraphs: [{ type: String, set: sanitizeRichText }], // tableau de paragraphes
    storyImage: { type: String, default: "" },

    // STATS
    stats: [
      {
        value: { type: String, required: true }, // ex: "5+", "10K+"
        label: { type: String, required: true },  // ex: "Années d'expérience"
      },
    ],

    // VALEURS
    valuesTag: { type: String, default: "Pourquoi nous choisir" },
    valuesTitle: { type: String, default: "" },
    values: [
      {
        icon: { type: String, required: true }, // nom d'icône ex: "FaShippingFast"
        title: { type: String, required: true },
        description: { type: String, required: true, set: sanitizeRichText },
      },
    ],

    // CTA
    ctaTitle: { type: String, default: "" },
    ctaSubtitle: { type: String, default: "", set: sanitizeRichText },
  },
  { timestamps: true }
);

// ✅ Empêche la création de plusieurs documents (singleton)
aboutPageSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

const AboutPageModel = mongoose.model("AboutPage", aboutPageSchema);
export default AboutPageModel;