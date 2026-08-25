// server/models/socialContent.model.js
import mongoose from "mongoose";

const socialContentSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produits",
      required: true,
    },

    objective: {
      type: String,
      enum: ["new", "promo", "low_stock", "premium"],
      required: true,
    },

    // Un texte par canal — certains peuvent être vides si la génération
    // a échoué partiellement (on ne bloque pas les autres canaux pour ça).
    whatsapp: { type: String, default: "" },
    instagram: { type: String, default: "" },
    facebook: { type: String, default: "" },
    tiktok: { type: String, default: "" },

    // Snapshot des données produit utilisées à la génération — utile pour
    // savoir si le contenu est "périmé" (prix/stock a changé depuis).
    generatedFromPrice: { type: Number },
    generatedFromStock: { type: Number },
  },
  { timestamps: true }
);

// Un seul contenu actif par produit + objectif — la régénération met à
// jour le document existant plutôt que d'en créer un nouveau.
socialContentSchema.index({ productId: 1, objective: 1 }, { unique: true });

const SocialContentModel = mongoose.model("SocialContent", socialContentSchema);
export default SocialContentModel;