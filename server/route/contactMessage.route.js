import express from "express";
import {
  sendMessage,
  getAllMessages,
  getMessageById,
  markAsRead,
  deleteMessage,
  sendReply,
} from "../controllers/contactMessage.controller.js";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.post("/send", sendMessage);
router.get("/", auth, adminAuth, getAllMessages);
router.get("/:id", auth, adminAuth, getMessageById);
router.put("/:id/read", auth, adminAuth, markAsRead);
router.post("/:id/reply", auth, adminAuth, upload.array("attachments"), sendReply);
router.delete("/:id", auth, adminAuth, deleteMessage);

export default router;