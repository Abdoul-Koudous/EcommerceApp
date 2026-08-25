// 📁 Fichier à remplacer : route/order.route.js

import { Router } from "express";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
import {
  getOrderDetailsController,
  getAllOrdersAdminController,
  updateOrderStatusController,
  trackOrderController,
} from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.get("/get", auth, getOrderDetailsController);

// Route admin : renvoie les commandes de TOUS les utilisateurs
// Réservée aux comptes ayant role === 'ADMIN' (voir middleware adminAuth)
orderRouter.get("/get-all", auth, adminAuth, getAllOrdersAdminController);

// Route admin : met à jour le statut logistique d'une commande
// Réservée aux comptes ayant role === 'ADMIN' (voir middleware adminAuth)
orderRouter.put("/update-status/:id", auth, adminAuth, updateOrderStatusController);

// ✅ AJOUT : suivi public par numéro de commande — pas d'authentification.
// Voir note sécurité : n'importe qui connaissant le numéro de commande
// peut consulter son statut et son adresse de livraison.
orderRouter.get("/track/:orderId", trackOrderController);

export default orderRouter;