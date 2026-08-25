import mongoose from "mongoose";

const homeSliderSchema = new mongoose.Schema(
  {
    images: [
      {
        type: String,
        required: true,
      },
    ],

    // ─── Contenu éditorial ───────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
    },

    subtitle: {
      type: String,
      trim: true,
      default: "",
    },

    // Petite étiquette d'accroche : "-30%", "Nouveau", "Édition limitée"
    badgeText: {
      type: String,
      trim: true,
      default: "",
    },

    badgeColor: {
      type: String,
      enum: ["primary", "accent", "success", "danger"],
      default: "accent",
    },

    // 2-3 arguments courts type "Livraison gratuite", "Garantie 2 ans"
    highlights: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 3,
        message: "Trois points forts (highlights) maximum par slide",
      },
    },

    // ─── Appel à l'action ────────────────────────────────────────────
    ctaText: {
      type: String,
      trim: true,
      default: "Découvrir",
    },

    // Optionnel — si vide, le front n'affiche pas de bouton
    ctaLink: {
      type: String,
      trim: true,
      default: "",
    },

    // ─── Diffusion ───────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    order: {
      type: Number,
      default: 0,
    },

    dateCreated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const HomeSliderModel = mongoose.model("HomeSlider", homeSliderSchema);
export default HomeSliderModel;