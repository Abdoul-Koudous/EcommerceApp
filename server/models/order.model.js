import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.ObjectId,
        ref: 'Utilisateur'
    },
    orderId: {
        type: String,
        required: [true, "Veuillez indiquer l'identifier de votre commande"],
        unique: true
    },
    productId:{
        type: mongoose.Schema.ObjectId,
        ref: "produit"
    },
    product_details:{
        name: String,
        image: Array,
    },
    paymentId:{
        type: String,
        default: ""
    },
    payment_status:{
        type: String,
        default: ""
    },
    delivery_address:{
        type: mongoose.Schema.ObjectId,
        ref: "address"
    },
    subTotalAmt:{
        type: Number,
        default: 0
    },
    totalAmt:{
        type: Number,
        default: 0
    },

},
    {timestamps: true}
)
const OrderModel =mongoose.model("Commande", orderSchema);
export default OrderModel