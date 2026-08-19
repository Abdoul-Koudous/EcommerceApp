import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
  verifyPaymentController,
  verifyKkiapayPaymentController,
  createCashOnDeliveryOrder,getOrderPreviewController ,
} from "../controllers/payment.controller.js";

const paymentRouter = Router();

paymentRouter.post("/verify", auth, verifyPaymentController);
paymentRouter.post("/verify-kkiapay", auth, verifyKkiapayPaymentController);
paymentRouter.post("/cash-on-delivery", auth, createCashOnDeliveryOrder);
paymentRouter.get("/preview-total", auth, getOrderPreviewController);

export default paymentRouter;