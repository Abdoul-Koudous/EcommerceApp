import { Router } from "express";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
import { addBlog, deleteBlog, getBlog, getBlogs, removeImageFromCloudinary, updatedBlog, uploadImages } from "../controllers/blog.controller.js";

const blogRouter = Router();


blogRouter.post("/uploadImages", auth, upload.array("images"), uploadImages);
blogRouter.post("/create", auth, addBlog);
blogRouter.delete("/deleteImage", auth, removeImageFromCloudinary);
blogRouter.get("/", getBlogs);
blogRouter.get("/:id", getBlog);

blogRouter.put("/:id", auth, updatedBlog);
blogRouter.delete("/:id", auth, deleteBlog);



export default blogRouter;