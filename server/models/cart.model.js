import mongoose from "mongoose";

const cartProductSchema = new mongoose.Schema({
    productId:{
        type: mongoose.Schema.ObjectId,
        ref: 'Produits'
    },
    quantity:{
        type: Number,
        default: 1
    },
    userId:{
        type: mongoose.Schema.ObjectId,
        ref: "Utilisateur"
    }
    
},
    {timestamps: true}
)
const cartProductModel  =mongoose.model("CartProduit", cartProductSchema);
export default cartProductModel