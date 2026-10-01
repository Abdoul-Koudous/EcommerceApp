import { Router } from 'express';
import auth from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';
import upload from '../middlewares/multer.js';
import {
  addHomeSlide,
  uploadImages,
  deleteSlide,
  getHomeSlides,
  getActiveHomeSlides,
  getSlide,
  removeImageFromCloudinary,
  updatedSlide,
  deleteMultipleSlides
} from '../controllers/homeSlider.controller.js';

const homeSlidesRouter = Router();

// ROUTES FIXES EN PREMIER (avant les routes dynamiques /:id)
homeSlidesRouter.get('/active', getActiveHomeSlides);                         // public : boutique
homeSlidesRouter.get('/', auth, adminAuth, getHomeSlides);                    // admin : toutes les slides
homeSlidesRouter.post('/create', auth, adminAuth, addHomeSlide);
homeSlidesRouter.post('/uploadImages', auth, adminAuth, upload.array('images'), uploadImages);
homeSlidesRouter.delete('/deleteImage', auth, adminAuth, removeImageFromCloudinary);
homeSlidesRouter.delete('/deleteMultipleSlides', auth, adminAuth, deleteMultipleSlides);

// ROUTES DYNAMIQUES À LA FIN
homeSlidesRouter.delete('/:id', auth, adminAuth, deleteSlide);
homeSlidesRouter.get('/:id', auth, adminAuth, getSlide);
homeSlidesRouter.put('/:id', auth, adminAuth, updatedSlide);

export default homeSlidesRouter;