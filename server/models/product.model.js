import mongoose from "mongoose";

const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String, required: true }],
    brand: { type: String, default: "" },
    price: { type: Number, default: 0 },
    oldPrice: { type: Number, default: 0 },
    catName: { type: String, default: "" },
    catId: { type: String, default: "" },
    subCatId: { type: String, default: "" },
    subCat: { type: String, default: "" },
    thirdsubCat: { type: String, default: "" },
    thirdSubCatId: { type: String, default: "" },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categorie",
      required: true,
    },

    countIntStock: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    discount: { type: Number, required: true },
    sale: { type: Number, default: 0 },

    // ────────────────────────────────────────────────────────────
    // ✅ Configuration taxe / livraison par produit (ton ajout)
    // ────────────────────────────────────────────────────────────

    // false = ce produit n'a JAMAIS de frais de livraison, peu importe la
    // ville ou la config globale (ex: un produit numérique, un service...)
    hasShipping: { type: Boolean, default: true },

    // Override fixe pour CE produit uniquement. null = pas d'override,
    // on retombe sur la zone de livraison (ville) puis sur le défaut global.
    shippingFee: { type: Number, default: null },

    // false = ce produit est EXONÉRÉ de taxe, peu importe la catégorie ou
    // le taux global (exonération explicite, différent de "pas configuré").
    hasTax: { type: Boolean, default: true },

    // Taux de taxe spécifique à ce produit, utilisé seulement si hasTax
    // est true. null = hérite du taux de sa catégorie, ou du taux global
    // si la catégorie n'en définit pas non plus.
    taxRate: { type: Number, default: null },

    // ────────────────────────────────────────────────────────────
    // ⚠️ INCHANGÉ : rétrocompatibilité avec les anciens produits
    // ────────────────────────────────────────────────────────────
    productRam: [{ type: String, default: null }],
    size: [{ type: String, default: null }],
    productWeight: [{ type: String, default: null }],

    bannerimages: [{ type: String, default: [] }],
    bannerTitleName: { type: String, required: true },
    dateCreated: { type: Date, default: Date.now },
    isDisplayOnHomeBanner: { type: Boolean, default: false },

    // ────────────────────────────────────────────────────────────
    // ✅ Système de variantes génériques (V2)
    // ────────────────────────────────────────────────────────────

    // Active ou non le système de variantes pour ce produit.
    // false = le produit fonctionne exactement comme avant (price/countIntStock globaux).
    hasVariants: { type: Boolean, default: false },

    // Si true, le stock est géré combinaison par combinaison (variantCombinations).
    // Si false, countIntStock reste la seule source de vérité.
    useVariantStock: { type: Boolean, default: false },

    // Définition libre des types de variantes pour ce produit.
    // Le vendeur choisit lui-même les noms : "Couleur", "RAM", "Taille", etc.
    variants: [
      {
        name: { type: String, required: true }, // ex: "Couleur"
        values: [{ type: String, required: true }], // ex: ["Rouge", "Noir"]
      },
    ],

    // Combinaisons réelles définies par le vendeur (auto-générées ou manuelles).
    // Le vendeur n'est pas obligé de couvrir toutes les combinaisons possibles.
    variantCombinations: [
      {
        combination: {
          type: Map,
          of: String,
          required: true,
        }, // Ex: { "Couleur": "Rouge", "Taille": "S" }

        stock: { type: Number, default: 0 },
        price: { type: Number, default: null }, // null = utilise le prix du produit
        sku: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true },
);

const ProductModel = mongoose.model("Produits", productSchema);
export default ProductModel;