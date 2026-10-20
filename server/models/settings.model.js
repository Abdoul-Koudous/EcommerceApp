import mongoose from "mongoose";

const settingsSchema = mongoose.Schema(
  {
    // ✅ Singleton : un seul document en base pour toute la boutique.
    // "singleton" est une valeur fixe qui sert de clé unique — permet de
    // faire un upsert simple sans avoir à connaître un _id à l'avance.
    key: {
      type: String,
      default: "singleton",
      unique: true,
    },

    defaultTaxRate: {
      type: Number,
      default: 0.18, // ✅ reprend la valeur actuelle en dur, pour ne rien changer au comportement existant tant que l'admin ne modifie rien
    },

    defaultShippingFee: {
      type: Number,
      default: 500, // ✅ idem, valeur actuelle conservée par défaut
    },

    currency: {
      type: String,
      default: "FCFA",
    },

    storeIdentity: {
      name: { type: String, default: "YebouShop", trim: true },
      logoLight: { type: String, default: "" },
      logoDark: { type: String, default: "" },
      email: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      whatsapp: { type: String, default: "", trim: true },
      address: { type: String, default: "", trim: true },
      promoBanner: { type: String, default: "", trim: true },
      socialLinks: {
        facebook: { type: String, default: "" },
        instagram: { type: String, default: "" },
        tiktok: { type: String, default: "" },
        linkedin: { type: String, default: "" },
      },
    },

    // Chaque boutique choisit sa combinaison. Les clés API restent dans
    // le .env du déploiement ; ici on n'active / désactive que l'offre.
    paymentMethods: {
      fedapay: { type: Boolean, default: true },
      kkiapay: { type: Boolean, default: true },
      cashOnDelivery: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

const SettingsModel = mongoose.model("Settings", settingsSchema);
export default SettingsModel;