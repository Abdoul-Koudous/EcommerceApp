import mongoose from "mongoose";

const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String, required: true }],
    brand: { type: String, default: "" },
    price: { type: Number, default: 0 },
    oldPrice: { type: Number, default: 0 },
    catName: { type: String, default: "" },
    catId: { type: String, default: "" },
    subCatId: { type: String, default: "" },
    subCat: { type: String, default: "" },
    thirdsubCat: { type: String, default: "" },
    thirdSubCatId: { type: String, default: "" },

    // ✅ ICI c’est BON
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categorie",
      required: true,
    },

    countIntStock: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    discount: { type: Number, required: true },
    sale: { type: Number, default: 0 },
    productRam: [{ type: String, default: null }],
    size: [{ type: String, default: null }],
    productWeight: [{ type: String, default: null }],
    bannerimages: [{ type: String, default: [] }],
    bannerTitleName: { type: String, required: true },
    dateCreated: { type: Date, default: Date.now },
    isDisplayOnHomeBanner: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const ProductModel = mongoose.model("Produits", productSchema);
export default ProductModel;
