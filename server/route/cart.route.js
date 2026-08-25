import { Router } from 'express';


import { addToCartItemController, deleteCartItemQtyController, emptyCartController, getCartItemController, updateCartItemController, mergeGuestCartController } from '../controllers/cart.controller.js';
import auth from '../middlewares/auth.js';
import optionalAuth from '../middlewares/optionalAuth.js';


const cartRouter = Router();

// ✅ MODIFIÉ : optionalAuth au lieu de auth — un visiteur non connecté
// peut ajouter/consulter/modifier son panier via guestSessionId.
cartRouter.post('/add', optionalAuth, addToCartItemController);
cartRouter.get('/get', optionalAuth, getCartItemController);
cartRouter.put('/update-qty', optionalAuth, updateCartItemController);
cartRouter.delete('/delete-cart-item/:id', optionalAuth, deleteCartItemQtyController);

// ⚠️ INCHANGÉ : vidage du panier après commande, toujours réservé aux
// utilisateurs connectés (appelé côté serveur après paiement confirmé).
cartRouter.delete('/emptyCart/:id', auth, emptyCartController);

// ✅ NOUVEAU : fusion du panier invité dans le compte, nécessite d'être
// connecté (c'est justement l'action qui vient de se produire).
cartRouter.post('/merge-guest-cart', auth, mergeGuestCartController);

export default cartRouter