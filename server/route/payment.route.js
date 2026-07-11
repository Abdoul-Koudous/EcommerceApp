import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
  verifyPaymentController,
  verifyKkiapayPaymentController,
  createCashOnDeliveryOrder,
} from "../controllers/payment.controller.js";

const paymentRouter = Router();

paymentRouter.post("/verify", auth, verifyPaymentController);
paymentRouter.post("/verify-kkiapay", auth, verifyKkiapayPaymentController);
paymentRouter.post("/cash-on-delivery", auth, createCashOnDeliveryOrder);

export default paymentRouter;