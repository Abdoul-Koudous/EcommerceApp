// server/models/trackingEvent.model.js
import mongoose from "mongoose";

const trackingEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["VISIT", "PRODUCT_VIEW", "ADD_TO_CART", "CHECKOUT", "PURCHASE"],
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produits",
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },
    campaignLinkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CampaignLink",
    },

    source: { type: String, default: "" },
    medium: { type: String, default: "" },
    campaign: { type: String, default: "" },

    sessionId: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Utilisateur" },

    orderId: { type: String, default: "" },
    amount: { type: Number, default: 0 },

    // ✅ NOUVEAU : false pour un PURCHASE en attente de paiement (paiement
    // à la livraison non encore livré) — n'est compté dans les Analytics
    // qu'une fois confirmé (voir order.controller.js, transition vers
    // "Livrée"). true par défaut : les paiements en ligne (FedaPay/KkiaPay)
    // sont déjà encaissés au moment de la création de la commande.
    confirmed: { type: Boolean, default: true },

    // ✅ NOUVEAU : true si la commande liée a été annulée — exclut l'event
    // des agrégations analytics sans le supprimer (historique brut conservé).
    voided: { type: Boolean, default: false },
  },
  { timestamps: true }
);

trackingEventSchema.index({ campaignId: 1, type: 1 });
trackingEventSchema.index({ productId: 1, type: 1 });
trackingEventSchema.index({ sessionId: 1 });
trackingEventSchema.index({ orderId: 1, type: 1 }); // ✅ NOUVEAU : accélère les updateMany par orderId

const TrackingEventModel = mongoose.model("TrackingEvent", trackingEventSchema);
export default TrackingEventModel;