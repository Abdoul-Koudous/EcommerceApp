import { Router } from 'express';

import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import { createProduct,removeImageFromCloudinary, deleteProducts, getAllFeaturedProducts, getAllProducts, getAllProductsByCatId, getAllProductsByCatName, getAllProductsByPrice, getAllProductsByRating, getAllProductsBySubCatId, getAllProductsBySubCatName, getProduct, getProductsCount, uploadImages, updateProduct, deleteMultipleProduct, getAllProductsByThirdLavelCatId, getAllProductsByThirdLavelCatName, getProducts, createProductRAM, deleteProductRAM, updateProductRAM, deleteMultipleProductRAM, getAllProductRAMs, getProductRAMById, createProductWEIGHT, createProductSIZE, deleteProductWEIGHT, deleteProductSIZE, deleteMultipleProductSIZE, deleteMultipleProductWEIGHT, updateProductWEIGHT, updateProductSIZE, getAllProductWEIGHTs, getAllProductSIZEs, getProductWEIGHTById, getProductSIZEById, uploadBannerImages, filters, sortBy, searchProductController, searchSuggestions } from '../controllers/product.controller.js';


const productRouter = Router();

productRouter.post('/uploadImages', auth, upload.array('images'), uploadImages);
productRouter.post('/uploadBannerImages', auth, upload.array('bannerimages'), uploadBannerImages);
productRouter.post('/create', auth, createProduct);
productRouter.post('/productRAM/create', auth,createProductRAM);
productRouter.post('/productSIZE/create', auth,createProductSIZE);
productRouter.post('/filters',filters);
productRouter.post('/sortBy',sortBy);
productRouter.post('/productWEIGHT/create', auth,createProductWEIGHT);
productRouter.get('/getAllProducts', getAllProducts);
productRouter.get('/getAllProductsByCatName', getAllProductsByCatName);
productRouter.get('/getAllProductsBySubCatName', getAllProductsBySubCatName);
productRouter.get('/getAllProductsByThirdLavelCatName', getAllProductsByThirdLavelCatName);
productRouter.get('/getAllProductsByPrice', getAllProductsByPrice);
productRouter.get('/getAllProductsByRating', getAllProductsByRating);
productRouter.get('/getAllProductsCount', getProductsCount);
productRouter.get("/", getProducts);
productRouter.get("/productRAM", getAllProductRAMs);
productRouter.get("/productSIZE", getAllProductSIZEs);
productRouter.get("/productWEIGHT", getAllProductWEIGHTs);
productRouter.get('/getAllFeaturedProducts', getAllFeaturedProducts);
productRouter.get('/search', searchProductController);
productRouter.get('/searchSuggestions', searchSuggestions);
productRouter.delete('/deleteImage', auth, removeImageFromCloudinary);
productRouter.delete('/deleteMultipleProduct', auth, deleteMultipleProduct);
productRouter.delete('/deleteMultipleProductRAM', auth, deleteMultipleProductRAM);
productRouter.delete('/deleteMultipleProductWEIGHT', auth, deleteMultipleProductWEIGHT);
productRouter.delete('/deleteMultipleProductSIZE', auth, deleteMultipleProductSIZE);
productRouter.put('/updateProduct/:id', auth, updateProduct);
productRouter.delete('/:id', deleteProducts);
productRouter.get('/:id', getProduct);
productRouter.get('/productRAM/:id', getProductRAMById);
productRouter.get('/productSIZE/:id', getProductSIZEById);
productRouter.get('/productWEIGHT/:id', getProductWEIGHTById);
productRouter.delete('/productRAM/:id', deleteProductRAM);
productRouter.delete('/productWEIGHT/:id', deleteProductWEIGHT);
productRouter.delete('/productSIZE/:id', deleteProductSIZE);
productRouter.put('/updateProductRAM/:id', auth, updateProductRAM);
productRouter.put('/updateProductWEIGHT/:id', auth, updateProductWEIGHT);
productRouter.put('/updateProductSIZE/:id', auth, updateProductSIZE);
productRouter.get('/getAllProductsByCatId/:id', getAllProductsByCatId);
productRouter.get('/getAllProductsByCatId/:id', getAllProductsByCatId);
productRouter.get('/getAllProductsBySubCatId/:id', getAllProductsBySubCatId);
productRouter.get('/getAllProductsByThirdLavelCat/:id', getAllProductsByThirdLavelCatId);

export default productRouter;