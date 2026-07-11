// WishlistTabPage.jsx
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./wishlisttab.scss";
import WishlistTabitemsItems from "./wishlisttabitems";
import { UserContext } from "../../UserContext/UserContext";

const WishlistTabPage = () => {
  const { myListItems, loadMyListItems } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    loadMyListItems();
  }, []);

  return (
    <div className="wishlist-page">
      <p>
        Vous avez <strong>{myListItems.length}</strong>{" "}
        {myListItems.length > 1 ? "produits" : "produit"} dans votre liste.
      </p>

      {myListItems.length === 0 ? (
        <div className="empty-wishlist">
          <img
            src="/MyListeRmpity.png"
            alt="Liste de souhaits vide"
            className="empty-wishlist-img"
          />
          <p className="empty-text">
            Votre liste de souhaits est vide pour le moment
          </p>
          <button
            className="continue-shopping-btn"
            onClick={() => navigate("/")}
          >
            Continuer les achats
          </button>
        </div>
      ) : (
        <div className="wishlist-items-container">
          <WishlistTabitemsItems items={myListItems} onRemoved={loadMyListItems} />
        </div>
      )}
    </div>
  );
};

export default WishlistTabPage;