import { Router } from "express";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
import {
  getAdminNotifications,
  getCustomerNotifications,
} from "../controllers/notification.controller.js";

const notificationRouter = Router();

notificationRouter.get("/mine", auth, getCustomerNotifications);
notificationRouter.get("/admin", auth, adminAuth, getAdminNotifications);

export default notificationRouter;
