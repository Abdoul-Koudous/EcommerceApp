import mongoose from "mongoose";

const productSIZEchema = new mongoose.Schema({
    name: { type: String, required: true },
    dateCreated: { type: Date, default: Date.now },

}, { timestamps: true });

export const ProductSIZE = mongoose.model("ProductSIZE", productSIZEchema);
export default ProductSIZE;