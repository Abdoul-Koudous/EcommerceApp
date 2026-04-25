import mongoose from "mongoose";

const reviewsSchema = new mongoose.Schema({
    userName : { type: String, default: '' },
    image: { type: String },
    review:{
        type: String,
        default: '',
    },
    description : { type: String, default: '' },
    rating: { type: Number, default: 0 },
    userId : { type: String, default: '' },
    productId : { type: String, default: '' },

   
}, { timestamps: true });

const ReviewsModel = mongoose.model("reviews", reviewsSchema);
export default ReviewsModel;