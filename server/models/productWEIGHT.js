import mongoose from "mongoose";

const productWEIGHTchema = new mongoose.Schema({
    name: { type: String, required: true },
    dateCreated: { type: Date, default: Date.now },

}, { timestamps: true });

export const ProductWEIGHT = mongoose.model("ProductWEIGHT", productWEIGHTchema);
export default ProductWEIGHT;