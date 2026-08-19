import express from "express";
import {
  getAboutPage,
  updateAboutPage,
  uploadAboutImages,
  removeAboutImage,
} from "../controllers/aboutPage.controller.js";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.get("/", getAboutPage);
router.put("/", auth, adminAuth, updateAboutPage);
router.post("/uploadImages", auth, adminAuth, upload.array("images"), uploadAboutImages);
router.delete("/removeImage", auth, adminAuth, removeAboutImage);

export default router;