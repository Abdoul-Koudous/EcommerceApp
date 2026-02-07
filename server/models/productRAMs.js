import mongoose from "mongoose";

const productRAMSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dateCreated: { type: Date, default: Date.now },

}, { timestamps: true });

export const ProductRAM = mongoose.model("ProductRAM", productRAMSchema);
export default ProductRAM;