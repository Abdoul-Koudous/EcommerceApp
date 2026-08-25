import mongoose from "mongoose";

const compareSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    productTitle: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    rating: {
        type: String,
        default: "0"
    },
    price: {
        type: Number,
        required: true
    },
    oldPrice: {
        type: Number,
        default: 0
    },
    brand: {
        type: String,
        default: "Sans marque"
    },
    discount: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

const CompareModel = mongoose.model('Comparer', compareSchema);

export default CompareModel;