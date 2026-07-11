import { Router } from "express";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
import {
  getOrderDetailsController,
  getAllOrdersAdminController,
} from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.get("/get", auth, getOrderDetailsController);

// Route admin : renvoie les commandes de TOUS les utilisateurs
// Réservée aux comptes ayant role === 'ADMIN' (voir middleware adminAuth)
orderRouter.get("/get-all", auth, adminAuth, getAllOrdersAdminController);

export default orderRouter;