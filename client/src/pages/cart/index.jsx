import React, { useContext, useEffect } from "react";
import "./cartpage.scss";
import CartItems from "./cartitems";
import { UserContext } from "../../UserContext/UserContext";

const CartPage = () => {
  const { cartItems, loadCartItems } = useContext(UserContext);

  useEffect(() => {
    loadCartItems();
  }, []);

  const shipping = 500;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const total = subtotal + shipping;

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h2>🛒 Mon Panier</h2>
        <p>
          Vous avez <strong>{cartItems.length}</strong>{" "}
          {cartItems.length > 1 ? "produits" : "produit"} dans votre panier.
        </p>
      </div>

      <div className="cart-content">
        <div className="cart-left">
          <CartItems items={cartItems} loadCartItems={loadCartItems} />
        </div>

        <div className="cart-right">
          <div className="cart-summary-box">
            <h3>Résumé du panier</h3>

            <div className="summary-row">
              <span>Sous-total</span>
              <span>{subtotal.toLocaleString()} FCFA</span>
            </div>

            <div className="summary-row">
              <span>Expédition</span>
              <span>{shipping.toLocaleString()} FCFA</span>
            </div>

            <div className="summary-row total">
              <span>Total à payer</span>
              <span>{total.toLocaleString()} FCFA</span>
            </div>

            <div className="summary-buttons">
              <button className="continue-btn" onClick={() => window.history.back()}>Continuer mes achats</button>
              <button className="checkout-btn">Passer à la caisse</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;