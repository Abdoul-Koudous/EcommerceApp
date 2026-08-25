// server/models/campaign.model.js
import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // ex: "Soldes Août"

    // Un ou plusieurs produits — couvre les deux cas d'usage
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Produits",
        required: true,
      },
    ],

    // Canaux activés pour cette campagne
    channels: [
      {
        type: String,
        enum: ["whatsapp", "instagram", "facebook", "tiktok"],
        required: true,
      },
    ],

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },

    // Slug de base utilisé pour générer les liens courts (ex: "sld-aout")
    // Unique pour éviter les collisions entre campagnes.
    baseSlug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const CampaignModel = mongoose.model("Campaign", campaignSchema);
export default CampaignModel;