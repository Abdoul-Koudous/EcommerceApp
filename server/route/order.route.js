import { Router } from "express";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
import {
  getOrderDetailsController,
  getAllOrdersAdminController,
  updateOrderStatusController,
} from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.get("/get", auth, getOrderDetailsController);

// Route admin : renvoie les commandes de TOUS les utilisateurs
// Réservée aux comptes ayant role === 'ADMIN' (voir middleware adminAuth)
orderRouter.get("/get-all", auth, adminAuth, getAllOrdersAdminController);

// Route admin : met à jour le statut logistique d'une commande
// Réservée aux comptes ayant role === 'ADMIN' (voir middleware adminAuth)
orderRouter.put("/update-status/:id", auth, adminAuth, updateOrderStatusController);

export default orderRouter;