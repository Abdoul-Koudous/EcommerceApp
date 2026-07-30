import { Router } from "express";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
import {
  getDashboardStatsController,
  getMonthlyStatsController,
} from "../controllers/dashboard.controller.js";

const dashboardRouter = Router();

// Statistiques globales (utilisateurs, commandes, revenus, produits, catégories)
dashboardRouter.get("/stats", auth, adminAuth, getDashboardStatsController);

// Statistiques mensuelles pour le graphe clients/ventes
dashboardRouter.get("/monthly-stats", auth, adminAuth, getMonthlyStatsController);

export default dashboardRouter;