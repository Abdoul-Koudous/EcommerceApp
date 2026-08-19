import mongoose from "mongoose";

const shippingZoneSchema = mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true,
    },
    fee: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true },
);

// ✅ Empêche deux règles pour la même ville (source d'ambiguïté au moment
// du calcul : laquelle appliquer si deux zones existent pour "Cotonou" ?)
shippingZoneSchema.index({ city: 1 }, { unique: true });

const ShippingZoneModel = mongoose.model("ShippingZone", shippingZoneSchema);
export default ShippingZoneModel;