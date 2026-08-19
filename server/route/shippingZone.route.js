import { Router } from "express";
import {
  getAllShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  deleteMultipleShippingZones,
} from "../controllers/shippingZone.controller.js";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";

const shippingZoneRouter = Router();

// Lecture publique : nécessaire pour le calcul du total au checkout
shippingZoneRouter.get("/", getAllShippingZones);

// Écriture réservée à l'admin
shippingZoneRouter.post("/add", auth, adminAuth, createShippingZone);

// Suppression multiple AVANT la route dynamique /:id (même pattern que userRouter)
shippingZoneRouter.delete("/deleteMultiple", auth, adminAuth, deleteMultipleShippingZones);

shippingZoneRouter.put("/update/:id", auth, adminAuth, updateShippingZone);
shippingZoneRouter.delete("/:id", auth, adminAuth, deleteShippingZone);

export default shippingZoneRouter;