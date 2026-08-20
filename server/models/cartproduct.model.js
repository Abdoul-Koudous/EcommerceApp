import mongoose from "mongoose";

const cartProductSchema = new mongoose.Schema(
  {
    productTitle: { type: String, required: true },
    image: { type: String, required: true },
    rating: Number,

    price: { type: Number, required: true },
    oldPrice: Number,
    discount: Number,

    // OPTIONS DISPONIBLES (produit)
    sizeOptions: [String],
    colorOptions: [String],
    ramOptions: [String],
    weightOptions: [String],

    // OPTIONS CHOISIES (panier) — ⚠️ INCHANGÉ : rétrocompatibilité avec
    // l'ancien système figé
    size: String,
    color: String,
    ram: String,
    weight: String,

    // ✅ NOUVEAU : sélection générique pour le système de variantes V2
    // Ex: { "Couleur": "Rouge", "Taille": "M" }
    selectedVariants: {
      type: Map,
      of: String,
      default: {},
    },

    // ✅ Snapshot du SKU de la combinaison choisie au moment de l'ajout
    selectedCombinationSku: { type: String, default: "" },

    quantity: { type: Number, required: true },
    subTotal: { type: Number, required: true },

    productId: { type: String, required: true },
    countInStock: { type: Number, required: true },
    userId: { type: String, required: true },

    brand: String,
  },
  { timestamps: true }
);

const CartProductModel = mongoose.model("CartProduct", cartProductSchema);
export default CartProductModel;