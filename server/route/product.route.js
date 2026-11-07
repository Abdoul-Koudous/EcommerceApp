import { Router } from 'express';

import auth from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';
import upload from '../middlewares/multer.js';
import { createProduct,removeImageFromCloudinary,getNewArrivals, getLowStockProducts, deleteProducts, getAllFeaturedProducts, getAllProducts, getAllProductsByCatId, getAllProductsByCatName, getAllProductsByPrice, getAllProductsByRating, getAllProductsBySubCatId, getAllProductsBySubCatName, getProduct, getProductsCount, uploadImages, updateProduct, deleteMultipleProduct, getAllProductsByThirdLavelCatId, getAllProductsByThirdLavelCatName, getProducts, createProductRAM, deleteProductRAM, updateProductRAM, deleteMultipleProductRAM, getAllProductRAMs, getProductRAMById, createProductWEIGHT, createProductSIZE, deleteProductWEIGHT, deleteProductSIZE, deleteMultipleProductSIZE, deleteMultipleProductWEIGHT, updateProductWEIGHT, updateProductSIZE, getAllProductWEIGHTs, getAllProductSIZEs, getProductWEIGHTById, getProductSIZEById, uploadBannerImages, filters, sortBy, searchProductController, searchSuggestions, generateVariantCombinations } from '../controllers/product.controller.js';


const productRouter = Router();

productRouter.post('/uploadImages', auth, adminAuth, upload.array('images'), uploadImages);
productRouter.post('/uploadBannerImages', auth, adminAuth, upload.array('bannerimages'), uploadBannerImages);
productRouter.post('/create', auth, adminAuth, createProduct);
productRouter.post('/productRAM/create', auth, adminAuth, createProductRAM);
productRouter.post('/productSIZE/create', auth, adminAuth, createProductSIZE);
productRouter.post('/filters',filters);
productRouter.post('/sortBy',sortBy);
productRouter.post('/generateVariantCombinations', auth, adminAuth, generateVariantCombinations);
productRouter.post('/productWEIGHT/create', auth, adminAuth, createProductWEIGHT);
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
productRouter.get("/newArrivals", getNewArrivals);
productRouter.get("/lowStock", getLowStockProducts);
productRouter.get('/searchSuggestions', searchSuggestions);
productRouter.delete('/deleteImage', auth, adminAuth, removeImageFromCloudinary);
productRouter.delete('/deleteMultipleProduct', auth, adminAuth, deleteMultipleProduct);
productRouter.delete('/deleteMultipleProductRAM', auth, adminAuth, deleteMultipleProductRAM);
productRouter.delete('/deleteMultipleProductWEIGHT', auth, adminAuth, deleteMultipleProductWEIGHT);
productRouter.delete('/deleteMultipleProductSIZE', auth, adminAuth, deleteMultipleProductSIZE);
productRouter.put('/updateProduct/:id', auth, adminAuth, updateProduct);
productRouter.delete('/:id', auth, adminAuth, deleteProducts);
productRouter.get('/:id', getProduct);
productRouter.get('/productRAM/:id', getProductRAMById);
productRouter.get('/productSIZE/:id', getProductSIZEById);
productRouter.get('/productWEIGHT/:id', getProductWEIGHTById);
productRouter.delete('/productRAM/:id', auth, adminAuth, deleteProductRAM);
productRouter.delete('/productWEIGHT/:id', auth, adminAuth, deleteProductWEIGHT);
productRouter.delete('/productSIZE/:id', auth, adminAuth, deleteProductSIZE);
productRouter.put('/updateProductRAM/:id', auth, adminAuth, updateProductRAM);
productRouter.put('/updateProductWEIGHT/:id', auth, adminAuth, updateProductWEIGHT);
productRouter.put('/updateProductSIZE/:id', auth, adminAuth, updateProductSIZE);
productRouter.get('/getAllProductsByCatId/:id', getAllProductsByCatId);
productRouter.get('/getAllProductsByCatId/:id', getAllProductsByCatId);
productRouter.get('/getAllProductsBySubCatId/:id', getAllProductsBySubCatId);
productRouter.get('/getAllProductsByThirdLavelCat/:id', getAllProductsByThirdLavelCatId);

export default productRouter;