import { Router } from "express";
import multer from "multer";
import {
  getSettings,
  updateSettings,
  uploadStoreLogo,
} from "../controllers/settings.controller.js";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";

const settingsRouter = Router();
const uploadStoreLogoFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(null, true);
    }
    const error = new Error("Le logo doit être au format JPG, PNG ou WebP");
    error.status = 400;
    return callback(error);
  },
});

// Lecture publique : le front (checkout, etc.) doit pouvoir lire les
// paramètres actifs sans être admin.
settingsRouter.get("/", getSettings);

// Modification réservée à l'admin
settingsRouter.put("/", auth, adminAuth, updateSettings);
settingsRouter.post(
  "/logo/:variant",
  auth,
  adminAuth,
  uploadStoreLogoFile.single("logo"),
  uploadStoreLogo,
);

export default settingsRouter;