import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    text: { type: String, default: "" },
    attachments: [{ type: String }], // URLs Cloudinary (images/vidéos)
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: "" },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    replies: [replySchema], // ✅ historique des réponses envoyées par l'admin
  },
  { timestamps: true }
);

const ContactMessageModel = mongoose.model("ContactMessage", contactMessageSchema);
export default ContactMessageModel;