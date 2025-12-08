import React from "react";
import { FaUser, FaEnvelope, FaHome, FaCity, FaFlag, FaPhone } from "react-icons/fa";
import "./checkout.scss";

const Checkout = () => {
  const cartItems = [
    { name: "SSD 500GB – La Révolution", price: 35000, quantity: 1, image: "/od11.jpg" },
    { name: "Clavier mécanique", price: 25000, quantity: 2, image: "/od21.jpg" },
    { name: "Souris gamer", price: 15000, quantity: 1, image: "/od31.jpg" },
    { name: "Souris gamer", price: 15000, quantity: 1, image: "/od31.jpg" },
    { name: "Souris gamer", price: 15000, quantity: 1, image: "/od31.jpg" },
    { name: "Souris gamer", price: 15000, quantity: 1, image: "/od31.jpg" },
    { name: "Souris gamer", price: 15000, quantity: 1, image: "/od31.jpg" },
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="checkout-page">
      <div className="checkout-container">

        {/* === Bloc gauche: Détails de facturation === */}
        <div className="billing-details">
          <h2>Détails de facturation</h2>
          <form className="billing-form">
            <div className="form-row">
              <div className="form-group">
                <FaUser className="input-icon" />
                <input type="text" placeholder=" " required />
                <label>Nom complet</label>
              </div>
              <div className="form-group">
                <FaEnvelope className="input-icon" />
                <input type="email" placeholder=" " required />
                <label>Email</label>
              </div>
            </div>

            <div className="form-group">
              <FaHome className="input-icon" />
              <input type="text" placeholder=" " required />
              <label>Nom de maison et rue</label>
            </div>

            <div className="form-group">
              <FaHome className="input-icon" />
              <input type="text" placeholder=" " />
              <label>Appartement, suite, unité (optionnel)</label>
            </div>

            <div className="form-row">
              <div className="form-group">
                <FaCity className="input-icon" />
                <input type="text" placeholder=" " required />
                <label>Ville</label>
              </div>
              <div className="form-group">
                <FaFlag className="input-icon" />
                <input type="text" placeholder=" " required />
                <label>Pays</label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <FaFlag className="input-icon" />
                <input type="text" placeholder=" " required />
                <label>Code postal</label>
              </div>
              <div className="form-group">
                <FaPhone className="input-icon" />
                <input type="text" placeholder=" " required />
                <label>Numéro de téléphone</label>
              </div>
            </div>
          </form>
        </div>

        {/* === Bloc droite: Votre commande === */}
        <div className="order-summary">
          <h2>Votre commande</h2>

          <div className="order-items">
            {cartItems.map((item, index) => (
              <div className="order-item" key={index}>
                <img src={item.image} alt={item.name} />
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">Quantité: {item.quantity}</span>
                </div>
                <span className="item-price">{(item.price * item.quantity).toLocaleString()} FCFA</span>
              </div>
            ))}
          </div>

          <div className="total-row">
            <span>Total</span>
            <span>{subtotal.toLocaleString()} FCFA</span>
          </div>

          <button className="btn-pay">Payer maintenant</button>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
