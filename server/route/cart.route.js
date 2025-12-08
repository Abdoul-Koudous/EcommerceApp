import { Router } from 'express';


import { addToCartItemController, deleteCartItemQtyController, getCartItemController, updateCartItemController } from '../controllers/cart.controller.js';
import auth from '../middlewares/auth.js';


const cartRouter = Router();

cartRouter.post('/add',auth,addToCartItemController);
cartRouter.get('/get',auth,getCartItemController);
cartRouter.put('/update-qty',auth,updateCartItemController);
cartRouter.delete('/delete-cart-item',auth,deleteCartItemQtyController);

export default cartRouter
