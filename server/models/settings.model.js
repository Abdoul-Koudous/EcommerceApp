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
  },
  { timestamps: true },
);

const SettingsModel = mongoose.model("Settings", settingsSchema);
export default SettingsModel;