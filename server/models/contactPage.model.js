import mongoose from "mongoose";

const contactPageSchema = new mongoose.Schema(
  {
    heroTag: { type: String, default: "Contact" },
    heroTitle: { type: String, default: "" },
    heroSubtitle: { type: String, default: "" },
    heroImage: { type: String, default: "" },

    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    hours: { type: String, default: "" },

    mapLat: { type: Number, default: null },
    mapLng: { type: Number, default: null },
    mapQuery: { type: String, default: "" }, // fallback si pas de lat/lng (ex: "Abomey-Calavi,Benin")
  },
  { timestamps: true }
);

contactPageSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

const ContactPageModel = mongoose.model("ContactPage", contactPageSchema);
export default ContactPageModel;