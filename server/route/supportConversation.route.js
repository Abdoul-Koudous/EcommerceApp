import { Router } from "express";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
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

supportConversationRouter.get("/mine", auth, getCustomerConversations);
supportConversationRouter.post("/mine", auth, createCustomerConversation);
supportConversationRouter.get("/mine/:id", auth, getCustomerConversation);
supportConversationRouter.post(
  "/mine/:id/messages",
  auth,
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
  sendAdminConversationMessage,
);
supportConversationRouter.put(
  "/admin/:id/status",
  auth,
  adminAuth,
  updateSupportConversationStatus,
);

export default supportConversationRouter;
