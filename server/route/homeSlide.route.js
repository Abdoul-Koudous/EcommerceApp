import { Router } from 'express';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import {
  addHomeSlide,
  uploadImages,
  deleteSlide,
  getHomeSlides,
  getSlide,
  removeImageFromCloudinary,
  updatedSlide,
  deleteMultipleSlides
} from '../controllers/homeSlider.controller.js';

const homeSlidesRouter = Router();

homeSlidesRouter.post('/create', auth, addHomeSlide);
homeSlidesRouter.get('/', getHomeSlides);
homeSlidesRouter.post('/uploadImages', auth, upload.array('images'), uploadImages); // ✅ ici tu dois appeler la fonction uploadImages
homeSlidesRouter.delete('/deleteImage', auth, removeImageFromCloudinary);
homeSlidesRouter.post('/deleteMultiple', auth, deleteMultipleSlides);
homeSlidesRouter.delete('/:id', auth, deleteSlide);
homeSlidesRouter.get('/:id', getSlide);
homeSlidesRouter.put('/:id', auth, updatedSlide);


export default homeSlidesRouter;