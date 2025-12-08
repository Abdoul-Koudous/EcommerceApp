import React from "react";
import "./cartpage.scss";
import CartItems from "./cartitems";

const CartPage = () => {
  const cartItems = [
    {
      id: 1,
      category: "Électronique",
      name: "SSD 500GB – La Révolution de la Vitesse",
      price: 35000,
      oldPrice: 42000,
      rating: 4,
      sizes: ["500GB", "1TB"],
      colors: ["Noir", "Argent"],
      quantity: 1,
      image: "/od31.jpg",
    },
    {
      id: 2,
      category: "Électronique",
      name: "Casque Bluetooth – Son Haute Qualité",
      price: 15000,
      oldPrice: 20000,
      rating: 5,
      sizes: ["Standard"],
      colors: ["Noir", "Rouge"],
      quantity: 1,
      image: "/od21.jpg",
    },
    {
      id: 3,
      category: "Informatique",
      name: "Clavier Mécanique RGB",
      price: 25000,
      oldPrice: 30000,
      rating: 4,
      sizes: ["Standard"],
      colors: ["Noir", "Blanc"],
      quantity: 1,
      image: "/od11.jpg",
    },
  ];

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
          <CartItems items={cartItems} />
        </div>

        <div className="cart-right">
          <div className="cart-summary-box">
            <h3>Résumé du panier</h3>

            {/* Calcul du total */}
            {(() => {
              const shipping = 500;
              const subtotal = cartItems.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0
              );
              const total = subtotal + shipping;

              return (
                <>
                  <div className="summary-row">
                    <span>Sous-total</span>
                    <span>{subtotal.toLocaleString()} FCFA</span>
                  </div>

                  <div className="summary-row">
                    <span>Expédition</span>
                    <span>{shipping.toLocaleString()} FCFA</span>
                  </div>

                  <div className="summary-row">
                    <span>Estimation pour</span>
                    <span>Bénin ({shipping.toLocaleString()} FCFA)</span>
                  </div>

                  <div className="summary-row total">
                    <span>Total à payer</span>
                    <span>{total.toLocaleString()} FCFA</span>
                  </div>

                  <div className="summary-buttons">
                    <button className="continue-btn">Continuer mes achats</button>
                    <button className="checkout-btn">Passer à la caisse</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
