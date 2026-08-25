import { Router } from "express";
import auth from "../middlewares/auth.js";
import optionalAuth from "../middlewares/optionalAuth.js"; // ✅ NOUVEAU
import {
  verifyPaymentController,
  verifyKkiapayPaymentController,
  createCashOnDeliveryOrder,
  getOrderPreviewController,
} from "../controllers/payment.controller.js";

const paymentRouter = Router();

paymentRouter.post("/verify", auth, verifyPaymentController);
paymentRouter.post("/verify-kkiapay", auth, verifyKkiapayPaymentController);
paymentRouter.post("/cash-on-delivery", auth, createCashOnDeliveryOrder);

// ✅ MODIFIÉ : optionalAuth au lieu de auth — un visiteur non connecté doit
// pouvoir voir le total de son panier invité (guestSessionId) avant de se
// connecter, exactement comme pour /api/cart/get.
paymentRouter.get("/preview-total", optionalAuth, getOrderPreviewController);

export default paymentRouter;