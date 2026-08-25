// server/models/campaignLink.model.js
import mongoose from "mongoose";

const campaignLinkSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Produits",
      required: true,
    },
    channel: {
      type: String,
      enum: ["whatsapp", "instagram", "facebook", "tiktok"],
      required: true,
    },

    // Identifiant court unique utilisé dans l'URL /go/:slug
    // ex: "sld-aout-montre-wa"
    slug: { type: String, required: true, unique: true },

    // Paramètres UTM correspondants, stockés pour éviter de les
    // recalculer à chaque redirection
    utm_source: { type: String, required: true },
    utm_medium: { type: String, default: "social" },
    utm_campaign: { type: String, required: true },

    // Compteur rapide pour affichage immédiat dans l'admin, sans agrégation
    // sur TrackingEvent à chaque chargement de page (le détail précis par
    // date/étape reste dans TrackingEvent pour les analytics fines).
    clickCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CampaignLinkModel = mongoose.model("CampaignLink", campaignLinkSchema);
export default CampaignLinkModel;