import mongoose from "mongoose";

const myListSchema = new mongoose.Schema({
    productId:{
        type: String,
        required: true
    },
    userId:{
        type: String,
        required: true
    },
    productTitle:{
        type:String,
        required:true
    },
    image:{
        type: String,
        required:true
    },
    rating:{
        type: String,
        required:true
    },
    price:{
        type: Number,
        required: true
    },
    oldPrice:{
        type: Number,
        required: true
    },
    brand:{
        type: String,
        required: true
    },
    discount:{
        type: Number,
        required: true
    },
},{timestamps: true});

const MyListModel = mongoose.model('MonSouhait',myListSchema)

export default MyListModel