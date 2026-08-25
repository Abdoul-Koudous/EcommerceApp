import mongoose from "mongoose";

const helpFaqSchema = new mongoose.Schema(
  {
    // Nom de catégorie tel qu'affiché (ex: "Commandes", "Livraison"...).
    // Texte libre, comme le champ `category` du blog — pas de collection
    // séparée pour les catégories.
    category: {
      type: String,
      required: true,
      trim: true,
    },

    // Icône de la carte catégorie sur la page d'accueil du centre d'aide.
    // Valeur = le champ "name" du catalogue d'icônes react-icons/fa
    // (ex: "FaBoxOpen", "FaTruck"...).
    categoryIcon: {
      type: String,
      required: true,
      trim: true,
    },

    // Courte description sous le titre de la catégorie.
    // ⚠️ Dupliquée sur chaque FAQ de la même catégorie : garder la même
    // valeur pour toutes les questions d'une catégorie donnée, sinon
    // l'affichage prendra celle de la FAQ la plus récente (voir
    // getCategories dans le contrôleur).
    categoryDescription: {
      type: String,
      default: "",
      trim: true,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    // Ordre d'affichage au sein d'une même catégorie (plus petit = en premier)
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Recherche texte pour la barre de recherche du centre d'aide
helpFaqSchema.index({ question: "text", answer: "text" });

const HelpFaqModel = mongoose.model("HelpFaq", helpFaqSchema);

export default HelpFaqModel;