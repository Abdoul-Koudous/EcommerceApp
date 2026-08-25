import express from "express";

import {
  uploadImages,
  addBlog,
  getBlogs,
  getBlogsAdmin,
  getFeaturedBlog,
  getCategories,
  getBlog,
  getBlogAdmin,
  updatedBlog,
  deleteBlog,
  removeImageFromCloudinary,
} from "../controllers/blog.controller.js";

import auth from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| LECTURE PUBLIQUE (articles publiés uniquement)
|--------------------------------------------------------------------------
*/

router.get("/getAll", getBlogs);
router.get("/getFeatured", getFeaturedBlog);
router.get("/getCategories", getCategories);
router.get("/getOne/:id", getBlog);

/*
|--------------------------------------------------------------------------
| ADMIN — lecture (brouillons + publiés)
|--------------------------------------------------------------------------
*/

router.get("/admin/getAll", auth, adminAuth, getBlogsAdmin);
router.get("/admin/getOne/:id", auth, adminAuth, getBlogAdmin);

/*
|--------------------------------------------------------------------------
| ADMIN — écriture
|--------------------------------------------------------------------------
*/

router.post("/uploadImages", auth, adminAuth, upload.array("images"), uploadImages);
router.post("/add", auth, adminAuth, addBlog);
router.put("/update/:id", auth, adminAuth, updatedBlog);
router.delete("/delete/:id", auth, adminAuth, deleteBlog);
router.delete("/deleteImage", auth, adminAuth, removeImageFromCloudinary);

export default router;