import mongoose from "mongoose";

const cartProductSchema = new mongoose.Schema(
  {
    productTitle: { type: String, required: true },
    image: { type: String, required: true },
    rating: Number,

    price: { type: Number, required: true },
    oldPrice: Number,
    discount: Number,

    // OPTIONS DISPONIBLES (produit)
    sizeOptions: [String],
    colorOptions: [String],
    ramOptions: [String],
    weightOptions: [String],

    // OPTIONS CHOISIES (panier)
    size: String,
    color: String,
    ram: String,
    weight: String,

    quantity: { type: Number, required: true },
    subTotal: { type: Number, required: true },

    productId: { type: String, required: true },
    countInStock: { type: Number, required: true },
    userId: { type: String, required: true },

    brand: String,
  },
  { timestamps: true }
);

const CartProductModel = mongoose.model("CartProduct", cartProductSchema);
export default CartProductModel;