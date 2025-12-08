import React from "react";
import { FaTrash } from "react-icons/fa";
import "./cartpanel.scss";

const CartPanel = ({ isOpen, onClose, cartItems }) => {

  const shipping = 500; // Prix d'expédition fixe
  const taxRate = 0.18; // Exemple 18% de taxes

  const handleRemoveItem = (index) => {
    console.log("Supprimer item à l'index :", index);
    // Ici tu peux gérer la suppression avec un state ou une fonction venant du parent
  };

  const totalProducts = cartItems.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );

  const taxes = totalProducts * taxRate;
  const totalTTC = totalProducts + shipping + taxes;

  return (
    <div className={`cart-panel ${isOpen ? "open" : ""}`}>
      {/* HEADER */}
      <div className="cart-header">
        <h3>Mon Panier ({cartItems.length})</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      {/* ITEMS */}
      <div className="cart-items">
        {cartItems.map((item, index) => (
          <div className="cart-item" key={index}>
            <div className="item-left">
              <img src={item.image || "/placeholder.png"} alt={item.name} />
            </div>
            <div className="item-center">
              <h4>{item.name}</h4>
              <p>Quantité: {item.quantity}</p>
              <p>Prix unitaire: {item.price.toLocaleString()} FCFA</p>
              <p>Total: {(item.price * item.quantity).toLocaleString()} FCFA</p>
            </div>
            <div className="item-right">
              <FaTrash className="remove-icon" onClick={() => handleRemoveItem(index)} />
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="cart-footer">
        <div className="footer-row">
          <span>{cartItems.length} produits</span>
          <span>{totalProducts.toLocaleString()} FCFA</span>
        </div>
        <div className="footer-row">
          <span>Expédition</span>
          <span>{shipping.toLocaleString()} FCFA</span>
        </div>
        <div className="footer-row">
          <span>Total (hors taxes)</span>
          <span>{totalProducts.toLocaleString()} FCFA</span>
        </div>
        <div className="footer-row">
          <span>Total (TTC)</span>
          <span>{totalTTC.toLocaleString()} FCFA</span>
        </div>
        <div className="footer-row">
          <span>Taxes</span>
          <span>{taxes.toLocaleString()} FCFA</span>
        </div>

        <div className="footer-buttons">
          <button className="view-cart-btn">Voir le panier</button>
          <button className="checkout-btn">Passer à la caisse</button>
        </div>
      </div>
    </div>
  );
};

export default CartPanel;
