import mongoose from "mongoose";

const paymentAttemptSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Utilisateur",
      required: true,
    },
    provider: {
      type: String,
      enum: ["fedapay", "kkiapay"],
      required: true,
    },
    deliveryAddress: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    cartItemIds: [{ type: String }],
    products: [
      {
        productId: String,
        productTitle: String,
        image: String,
        price: Number,
        quantity: Number,
        selectedVariants: {
          type: Map,
          of: String,
          default: {},
        },
        selectedCombinationSku: { type: String, default: "" },
      },
    ],
    subTotalAmt: { type: Number, required: true },
    shippingAmt: { type: Number, required: true },
    taxAmt: { type: Number, required: true },
    totalAmt: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    paymentId: { type: String, default: "" },
    orderId: { type: String, default: "" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

paymentAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PaymentAttemptModel = mongoose.model(
  "PaymentAttempt",
  paymentAttemptSchema,
);

export default PaymentAttemptModel;
