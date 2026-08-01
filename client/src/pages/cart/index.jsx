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
    <div className="cp-page">
      <div className="cp-header">
        <h2>🛒 Mon Panier</h2>
        <p>
          Vous avez <strong>{cartItems.length}</strong>{" "}
          {cartItems.length > 1 ? "produits" : "produit"} dans votre panier.
        </p>
      </div>

      <div className="cp-content">
        <div className="cp-left">
          <CartItems items={cartItems} loadCartItems={loadCartItems} />
        </div>

        <div className="cp-right">
          <div className="cp-summary-box">
            <h3>Résumé du panier</h3>

            <div className="cp-summary-row">
              <span>Sous-total</span>
              <span>{subtotal.toLocaleString()} FCFA</span>
            </div>

            <div className="cp-summary-row">
              <span>Expédition</span>
              <span>{shipping.toLocaleString()} FCFA</span>
            </div>

            <div className="cp-summary-row cp-total">
              <span>Total à payer</span>
              <span>{total.toLocaleString()} FCFA</span>
            </div>

            <div className="cp-summary-buttons">
              <button className="cp-continue-btn" onClick={() => window.history.back()}>
                Continuer mes achats
              </button>
              <button className="cp-checkout-btn">Passer à la caisse</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;