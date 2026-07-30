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
    // 📸 Snapshot figé de l'adresse de livraison au moment de la commande.
    // On NE référence plus une Address par ObjectId : on copie son contenu.
    // Ainsi, si l'utilisateur modifie ou supprime sa fiche adresse plus tard,
    // l'historique de commande reste intact et fidèle à ce qui a réellement
    // été utilisé pour la livraison. Le destinataire peut être différent du
    // titulaire du compte (ex: cadeau, livraison bureau, etc.).
    delivery_address: {
      addressId: { type: mongoose.Schema.ObjectId, ref: "Address" }, // traçabilité uniquement
      name: { type: String, required: true }, // nom du DESTINATAIRE
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