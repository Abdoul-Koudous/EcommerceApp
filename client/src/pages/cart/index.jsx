import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./cartpage.scss";
import CartItems from "./cartitems";
import { UserContext } from "../../UserContext/UserContext";
import { fetchDataFromApi } from "../utils/api";
import { getSessionId } from "../utils/tracking";

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, loadCartItems, user } = useContext(UserContext);

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
    if (cartItems.length === 0) return;

    // ✅ MODIFIÉ : envoie guestSessionId si pas connecté, comme dans
    // CartPanel.jsx — sinon total bloqué à 0 pour un visiteur anonyme.
    const url = user?._id
      ? "/api/payment/preview-total"
      : `/api/payment/preview-total?guestSessionId=${getSessionId()}`;

    let isCurrent = true;
    fetchDataFromApi(url).then((res) => {
      if (isCurrent && !res?.error) {
        setTotals({
          subTotalAmt: res.subTotalAmt || 0,
          shippingAmt: res.shippingAmt || 0,
          taxAmt: res.taxAmt || 0,
          totalAmt: res.totalAmt || 0,
        });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [cartItems, user]);

  const visibleTotals =
    cartItems.length > 0
      ? totals
      : { subTotalAmt: 0, shippingAmt: 0, taxAmt: 0, totalAmt: 0 };

  const handleGoToCheckout = () => {
    if (cartItems.length === 0) return;
    navigate("/checkout");
  };

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

            {cartItems.length === 0 ? (
              <p className="cp-empty-summary">Votre panier est vide.</p>
            ) : (
              <>
                {visibleTotals.subTotalAmt > 0 && (
                  <div className="cp-summary-row">
                    <span>Sous-total</span>
                    <span>{visibleTotals.subTotalAmt.toLocaleString()} FCFA</span>
                  </div>
                )}

                {visibleTotals.shippingAmt > 0 && (
                  <div className="cp-summary-row">
                    <span>Expédition</span>
                    <span>{visibleTotals.shippingAmt.toLocaleString()} FCFA</span>
                  </div>
                )}

                {visibleTotals.taxAmt > 0 && (
                  <div className="cp-summary-row">
                    <span>Taxes</span>
                    <span>{visibleTotals.taxAmt.toLocaleString()} FCFA</span>
                  </div>
                )}

                <div className="cp-summary-row cp-total">
                  <span>Total à payer</span>
                  <span>{visibleTotals.totalAmt.toLocaleString()} FCFA</span>
                </div>
              </>
            )}

            <div className="cp-summary-buttons">
              <button className="cp-continue-btn" onClick={() => window.history.back()}>
                Continuer mes achats
              </button>
              <button
                className="cp-checkout-btn"
                onClick={handleGoToCheckout}
                disabled={cartItems.length === 0}
              >
                Passer à la caisse
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;