import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["customer", "admin"],
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Utilisateur",
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    seenByCustomer: {
      type: Boolean,
      default: false,
    },
    seenByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

const supportConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Utilisateur",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    orderId: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    messages: {
      type: [supportMessageSchema],
      validate: {
        validator: (messages) => messages.length > 0,
        message: "Une conversation doit contenir au moins un message",
      },
    },
  },
  { timestamps: true },
);

supportConversationSchema.index({ userId: 1, lastMessageAt: -1 });
supportConversationSchema.index({ status: 1, lastMessageAt: -1 });

const SupportConversationModel = mongoose.model(
  "SupportConversation",
  supportConversationSchema,
);

export default SupportConversationModel;
