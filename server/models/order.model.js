import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "Utilisateur",
    },
    orderId: {
      type: String,
      required: [true, "Veuillez indiquer l'identifiant de votre commande"],
      unique: true,
    },
    products: [
      {
        productId: { type: String },
        productTitle: { type: String },
        image: { type: String },
        price: { type: Number },
        quantity: { type: Number },

        // ✅ NOUVEAU : snapshot de la variante choisie au moment de la
        // commande (ex: { "Couleur": "Rouge", "Taille": "M" }), figé
        // même si le produit change après.
        selectedVariants: {
          type: Map,
          of: String,
          default: {},
        },
        selectedCombinationSku: { type: String, default: "" },
      },
    ],
    paymentId: {
      type: String,
      default: "",
    },
    payment_status: {
      type: String,
      enum: ["Payée", "À payer à la livraison", "Échec"],
      default: "À payer à la livraison",
    },
    order_status: {
      type: String,
      enum: ["Reçue", "En préparation", "Expédiée", "Livrée", "Annulée"],
      default: "Reçue",
    },
    delivery_address: {
      addressId: { type: mongoose.Schema.ObjectId, ref: "Address" },
      name: { type: String, required: true },
      mobile: { type: String, required: true },
      address_line1: { type: String, required: true },
      landmark: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: "" },
      addressType: { type: String, default: "" },
    },
    subTotalAmt: {
      type: Number,
      default: 0,
    },
    shippingAmt: {
      type: Number,
      default: 0,
    },
    taxAmt: {
      type: Number,
      default: 0,
    },
    totalAmt: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const OrderModel = mongoose.model("Commande", orderSchema);
export default OrderModel;