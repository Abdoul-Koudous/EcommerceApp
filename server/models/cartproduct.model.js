import mongoose from "mongoose";

const cartProductSchema = new mongoose.Schema(
  {
    productTitle: { type: String, required: true },
    image: { type: String, required: true },
    rating: Number,

    price: { type: Number, required: true },
    oldPrice: Number,
    discount: Number,

    sizeOptions: [String],
    colorOptions: [String],
    ramOptions: [String],
    weightOptions: [String],

    size: String,
    color: String,
    ram: String,
    weight: String,

    selectedVariants: {
      type: Map,
      of: String,
      default: {},
    },
    selectedCombinationSku: { type: String, default: "" },

    quantity: { type: Number, required: true },
    subTotal: { type: Number, required: true },

    productId: { type: String, required: true },
    countInStock: { type: Number, required: true },

    // ✅ MODIFIÉ : plus obligatoire — un panier peut appartenir à un
    // visiteur non connecté (identifié par guestSessionId à la place).
    userId: { type: String, required: false },

    // ✅ NOUVEAU : identifiant de session anonyme, réutilise le même
    // sessionId que le système de tracking (client/src/pages/utils/tracking.js),
    // pour garder une seule notion de "visiteur" cohérente dans tout le site.
    guestSessionId: { type: String, required: false },

    brand: String,
  },
  { timestamps: true }
);

// Un item de panier doit appartenir à un compte OU à une session invité,
// jamais aucun des deux (sécurité applicative, vérifiée dans le controller).
cartProductSchema.index({ userId: 1 });
cartProductSchema.index({ guestSessionId: 1 });

const CartProductModel = mongoose.model("CartProduct", cartProductSchema);
export default CartProductModel;