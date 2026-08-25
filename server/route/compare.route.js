// route/compare.route.js
import { Router } from 'express';
import auth from '../middlewares/auth.js';
import {
    addToCompareController,
    deleteFromCompareController,
    getCompareController
} from '../controllers/compare.controller.js';

const compareRouter = Router();

compareRouter.post("/add", auth, addToCompareController);
compareRouter.get("/", auth, getCompareController);
compareRouter.delete("/remove/:productId", auth, deleteFromCompareController);

export default compareRouter;