import express from "express";
import {
  getContactPage,
  updateContactPage,
  uploadContactImages,
  removeContactImage,
} from "../controllers/contactPage.controller.js";
import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.get("/", getContactPage);
router.put("/", auth, adminAuth, updateContactPage);
router.post("/uploadImages", auth, adminAuth, upload.array("images"), uploadContactImages);
router.delete("/removeImage", auth, adminAuth, removeContactImage);

export default router;