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
      },
    ],
    paymentId: {
      type: String,
      default: "",
    },
    // Statut du paiement uniquement : la personne a-t-elle payé ?
    payment_status: {
      type: String,
      enum: ["Payée", "À payer à la livraison", "Échec"],
      default: "À payer à la livraison",
    },
    // Statut logistique de la commande : où en est-elle physiquement ?
    order_status: {
      type: String,
      enum: ["Reçue", "En préparation", "Expédiée", "Livrée", "Annulée"],
      default: "Reçue",
    },
    delivery_address: {
      type: mongoose.Schema.ObjectId,
      ref: "Address",
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