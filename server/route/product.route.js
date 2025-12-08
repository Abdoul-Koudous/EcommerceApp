import { Router } from 'express';

import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { createProduct,removeImageFromCloudinary, deleteProducts, getAllFeaturedProducts, getAllProducts, getAllProductsByCatId, getAllProductsByCatName, getAllProductsByPrice, getAllProductsByRating, getAllProductsBySubCatId, getAllProductsBySubCatName, getProduct, getProductsCount, uploadImages, updateProduct} from '../controllers/product.controller.js';


const productRouter = Router();

productRouter.post('/uploadImages', auth, upload.array('images'), uploadImages);
productRouter.post('/create', auth, createProduct);
productRouter.get('/getAllProducts', getAllProducts);
productRouter.get('/getAllProductsByCatId/:id', getAllProductsByCatId);
productRouter.get('/getAllProductsByCatName', getAllProductsByCatName);
productRouter.get('/getAllProductsBySubCatId/:id', getAllProductsBySubCatId);
productRouter.get('/getAllProductsBySubCatName', getAllProductsBySubCatName);
productRouter.get('/getAllProductsByThirdLavelCat/:id', getAllProductsByCatId);
productRouter.get('/getAllProductsByThirdLavelCatName', getAllProductsByCatName);
productRouter.get('/getAllProductsByPrice', getAllProductsByPrice);
productRouter.get('/getAllProductsByRating', getAllProductsByRating);
productRouter.get('/getAllProductsCount', getProductsCount);
productRouter.get('/getAllFeaturedProducts', getAllFeaturedProducts);
productRouter.delete('/deleteImage', auth, removeImageFromCloudinary);
productRouter.delete('/updateProduct/:id', auth, updateProduct);
productRouter.delete('/:id', deleteProducts);
productRouter.get('/:id', getProduct);

export default productRouter;