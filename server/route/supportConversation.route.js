import { Router } from "express";
import multer from "multer";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
import { ALLOWED_SUPPORT_MIME_TYPES } from "../services/supportMessage.service.js";
import {
  createCustomerConversation,
  getCustomerConversations,
  getCustomerConversation,
  sendCustomerConversationMessage,
  getAdminConversations,
  getAdminConversation,
  sendAdminConversationMessage,
  updateSupportConversationStatus,
} from "../controllers/supportConversation.controller.js";

const supportConversationRouter = Router();
const uploadSupportAttachments = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 4 },
  fileFilter: (_request, file, callback) => {
    if (ALLOWED_SUPPORT_MIME_TYPES.has(file.mimetype)) {
      return callback(null, true);
    }
    const error = new Error(
      "Formats acceptés : JPG, PNG, WebP, GIF, MP4, WebM ou MOV",
    );
    error.status = 400;
    return callback(error);
  },
});

supportConversationRouter.get("/mine", auth, getCustomerConversations);
supportConversationRouter.post(
  "/mine",
  auth,
  uploadSupportAttachments.array("attachments", 4),
  createCustomerConversation,
);
supportConversationRouter.get("/mine/:id", auth, getCustomerConversation);
supportConversationRouter.post(
  "/mine/:id/messages",
  auth,
  uploadSupportAttachments.array("attachments", 4),
  sendCustomerConversationMessage,
);

supportConversationRouter.get(
  "/admin",
  auth,
  adminAuth,
  getAdminConversations,
);
supportConversationRouter.get(
  "/admin/:id",
  auth,
  adminAuth,
  getAdminConversation,
);
supportConversationRouter.post(
  "/admin/:id/messages",
  auth,
  adminAuth,
  uploadSupportAttachments.array("attachments", 4),
  sendAdminConversationMessage,
);
supportConversationRouter.put(
  "/admin/:id/status",
  auth,
  adminAuth,
  updateSupportConversationStatus,
);

export default supportConversationRouter;
