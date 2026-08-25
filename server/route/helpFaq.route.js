import express from "express";

import {
  addFaq,
  getFaqs,
  getCategories,
  getFaqsAdmin,
  getFaqAdmin,
  updateFaq,
  deleteFaq,
} from "../controllers/helpFaq.controller.js";

import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| LECTURE PUBLIQUE (questions publiées uniquement)
|--------------------------------------------------------------------------
*/

router.get("/getAll", getFaqs);
router.get("/getCategories", getCategories);

/*
|--------------------------------------------------------------------------
| ADMIN — lecture (brouillons + publiées)
|--------------------------------------------------------------------------
*/

router.get("/admin/getAll", auth, adminAuth, getFaqsAdmin);
router.get("/admin/getOne/:id", auth, adminAuth, getFaqAdmin);

/*
|--------------------------------------------------------------------------
| ADMIN — écriture
|--------------------------------------------------------------------------
*/

router.post("/add", auth, adminAuth, addFaq);
router.put("/update/:id", auth, adminAuth, updateFaq);
router.delete("/delete/:id", auth, adminAuth, deleteFaq);

export default router;