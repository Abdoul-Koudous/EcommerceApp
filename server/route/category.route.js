import { Router } from 'express';

import auth from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';
import upload from '../middlewares/multer.js';
import { createCategory, deleteCategory, getCategories,removeImageFromCloudinary, getCategoriesCount, getCategory, getSubCategoriesCount, uploadImages, updatedCategory } from '../controllers/category.controller.js';


const categoryRouter = Router();
categoryRouter.post('/uploadImages', auth, adminAuth, upload.array('images'), uploadImages);
categoryRouter.post('/create', auth, adminAuth, createCategory);
categoryRouter.get('/', getCategories);
categoryRouter.get('/get/count', getCategoriesCount);
categoryRouter.get('/get/count/subCat', getSubCategoriesCount);
categoryRouter.delete('/deleteImage', auth, adminAuth, removeImageFromCloudinary);
categoryRouter.delete('/:id', auth, adminAuth, deleteCategory);
categoryRouter.get('/:id', getCategory);
categoryRouter.put('/:id', auth, adminAuth, updatedCategory);

export default categoryRouter;