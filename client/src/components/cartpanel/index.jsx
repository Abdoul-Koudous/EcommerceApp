import React, { useContext, useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import "./cartPanel.scss";
import { deleteData, fetchDataFromApi } from "../../pages/utils/api";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../../UserContext/UserContext";

const CartPanel = ({ isOpen, onClose, openToast }) => {
  const navigate = useNavigate();
  const { cartItems, loadCartItems } = useContext(UserContext);

  // ✅ Totaux calculés côté serveur (taxe/livraison configurables),
  // plus de valeurs en dur ici.
  const [totals, setTotals] = useState({
    subTotalAmt: 0,
    shippingAmt: 0,
    taxAmt: 0,
    totalAmt: 0,
  });

  useEffect(() => {
    if (!isOpen || cartItems.length === 0) return;

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
  }, [isOpen, cartItems]);

  const handleRemoveItem = (id) => {
    if (!id) return;

    deleteData(`/api/cart/delete-cart-item/${id}`)
      .then((res) => {
        if (res?.success) {
          openToast("success", res?.message || "Produit supprimé du panier");
          loadCartItems();
        } else {
          openToast("error", res?.message || "Erreur suppression");
        }
      })
      .catch((err) => {
        openToast("error", "Erreur serveur lors de la suppression");
        console.log("Erreur suppression:", err);
      });
  };

  const goToCartPage = () => {
    console.log("CLICK OK");
    navigate("/cart");
    onClose(); // ferme le panel
  };

  return (
    <div className={`cart-panel ${isOpen ? "open" : ""}`}>
      {/* HEADER */}
      <div className="cart-header">
        <h3>Mon Panier ({cartItems.length})</h3>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      {/* ITEMS */}
      <div className="cart-items">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <img
              src="/empty-cart.png"
              alt="Panier vide"
              className="empty-cart-img"
            />

            <p className="empty-text">Votre panier est vide pour le moment</p>

            <button className="continue-shopping-btn" onClick={onClose}>
              Continuer les achats
            </button>
          </div>
        ) : (
          cartItems.map((item) => (
            <div className="cart-item" key={item._id}>
              <div className="item-left">
                <img src={item.image || "/placeholder.png"} alt={item.name} />
              </div>
              <div className="item-center">
                <h4>
                  {item.productTitle.length > 25
                    ? item.productTitle.substring(0, 25) + "..."
                    : item.productTitle}
                </h4>
                <p>Quantité: {item.quantity}</p>
                <p>Prix unitaire: {item.price.toLocaleString()} FCFA</p>
                <p>
                  Total: {(item.price * item.quantity).toLocaleString()} FCFA
                </p>
              </div>
              <div className="item-right">
                <FaTrash
                  className="remove-icon"
                  onClick={() => handleRemoveItem(item._id)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER */}
      <div className="cart-footer">
        <div className="footer-row">
          <span>{cartItems.length} produits</span>
          <span>{totals.subTotalAmt.toLocaleString()} FCFA</span>
        </div>
        <div className="footer-row">
          <span>Expédition</span>
          <span>{totals.shippingAmt.toLocaleString()} FCFA</span>
        </div>
        <div className="footer-row">
          <span>Total (hors taxes)</span>
          <span>{totals.subTotalAmt.toLocaleString()} FCFA</span>
        </div>
        <div className="footer-row">
          <span>Taxes</span>
          <span>{totals.taxAmt.toLocaleString()} FCFA</span>
        </div>
        <div className="footer-row">
          <span>Total (TTC)</span>
          <span>{totals.totalAmt.toLocaleString()} FCFA</span>
        </div>

        <div className="footer-buttons">
          <Link className="view-cart-btn" to="/cart" onClick={onClose}>
            Voir le panier
          </Link>
          <button
            className="checkout-btn"
            onClick={() => {
              navigate("/checkout");
              onClose();
            }}
          >
            Passer à la caisse
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPanel;