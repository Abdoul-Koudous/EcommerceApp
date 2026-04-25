import mongoose from "mongoose";

const bannerV1Schema = new mongoose.Schema({
    bannerTitle : { type: String, required: true, default: '' },
    images: [{ type: String }],
    categoryName : { type: String, required: true, default: '' },
    catId : { type: String, required: true, default: '' },
    subCatId : { type: String, default: '' },
    thirdsubCatId : { type: String, default: '' }, 
    price : { type: Number, required: true, default: 0 },
    alignInfo : { type: String, required: true, default: '' },
}, { timestamps: true });

const BannerV1Model = mongoose.model("bannerV1", bannerV1Schema);
export default BannerV1Model;