// WishlistTabPage.jsx
import React from "react";
import "./wishlisttab.scss";
import WishlistTabitemsItems from "./wishlisttabitems";

const WishlistTabPage = () => {
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
    {
      id: 4,
      category: "Informatique",
      name: "Souris Gaming RGB",
      price: 12000,
      oldPrice: 15000,
      rating: 5,
      sizes: ["Standard"],
      colors: ["Noir", "Rouge"],
      quantity: 1,
      image: "/od12.jpg",
    },
    {
      id: 5,
      category: "Informatique",
      name: "Webcam HD",
      price: 8000,
      oldPrice: 10000,
      rating: 4,
      sizes: ["Standard"],
      colors: ["Noir"],
      quantity: 1,
      image: "/od13.jpg",
    },
  ];

  return (
    <div className="wishlist-page">

      
       <p>
        Vous avez <strong>{cartItems.length}</strong>{" "}
        {cartItems.length > 1 ? "produits" : "produit"} dans votre liste.
      </p>
      <div className="wishlist-items-container">
       
        <WishlistTabitemsItems items={cartItems} />
      </div>
    </div>
  );
};

export default WishlistTabPage;
