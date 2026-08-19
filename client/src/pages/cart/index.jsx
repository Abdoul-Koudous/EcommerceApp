import React, { useContext, useEffect, useState } from "react";
import "./cartpage.scss";
import CartItems from "./cartitems";
import { UserContext } from "../../UserContext/UserContext";
import { fetchDataFromApi } from "../utils/api";

const CartPage = () => {
  const { cartItems, loadCartItems } = useContext(UserContext);

  const [totals, setTotals] = useState({
    subTotalAmt: 0,
    shippingAmt: 0,
    taxAmt: 0,
    totalAmt: 0,
  });

  useEffect(() => {
    loadCartItems();
  }, []);

  useEffect(() => {
    if (cartItems.length === 0) {
      setTotals({ subTotalAmt: 0, shippingAmt: 0, taxAmt: 0, totalAmt: 0 });
      return;
    }

    // ✅ Totaux calculés côté serveur, cohérents avec CartPanel et Checkout
    fetchDataFromApi("/api/payment/preview-total").then((res) => {
      if (!res?.error) {
        setTotals({
          subTotalAmt: res.subTotalAmt || 0,
          shippingAmt: res.shippingAmt || 0,
          taxAmt: res.taxAmt || 0,
          totalAmt: res.totalAmt || 0,
        });
      }
    });
  }, [cartItems]);

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
              <span>{totals.subTotalAmt.toLocaleString()} FCFA</span>
            </div>

            <div className="cp-summary-row">
              <span>Expédition</span>
              <span>{totals.shippingAmt.toLocaleString()} FCFA</span>
            </div>

            <div className="cp-summary-row">
              <span>Taxes</span>
              <span>{totals.taxAmt.toLocaleString()} FCFA</span>
            </div>

            <div className="cp-summary-row cp-total">
              <span>Total à payer</span>
              <span>{totals.totalAmt.toLocaleString()} FCFA</span>
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