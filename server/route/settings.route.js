import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";

const settingsRouter = Router();

// Lecture publique : le front (checkout, etc.) doit pouvoir lire les
// paramètres actifs sans être admin.
settingsRouter.get("/", getSettings);

// Modification réservée à l'admin
settingsRouter.put("/", auth, adminAuth, updateSettings);

export default settingsRouter;