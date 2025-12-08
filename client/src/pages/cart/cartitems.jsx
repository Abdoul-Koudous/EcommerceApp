import React from "react";
import { FaTrash, FaStar } from "react-icons/fa";
import "./cartitems.scss";

const CartItems = ({ items }) => {
  const handleRemove = (id) => {
    console.log("Supprimer l'article avec id :", id);
  };

  const handleSelectChange = (id, field, value) => {
    console.log(`Produit ${id} : ${field} changé à ${value}`);
  };

  return (
    <div className="cart-items">
      {items.map((item) => {
        const reduction =
          item.oldPrice && item.price
            ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)
            : 0;

        return (
          <div className="cart-item" key={item.id}>
            <img src={item.image || "/placeholder.png"} alt={item.name} />

            <div className="item-details">
              {/* Catégorie */}
              <span className="item-category">{item.category || "Informatique"}</span>

              {/* Nom du produit */}
              <h4 className="item-title">{item.name}</h4>

              {/* Étoiles */}
              <div className="item-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={i < item.rating ? "star active" : "star"} />
                ))}
              </div>

              {/* Caractéristiques */}
              <div className="item-attributes">
                <div className="attr">
                  <label>Taille :</label>
                  <select
                    onChange={(e) =>
                      handleSelectChange(item.id, "taille", e.target.value)
                    }
                  >
                    {item.sizes?.map((s, i) => (
                      <option key={i}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="attr">
                  <label>Couleur :</label>
                  <select
                    onChange={(e) =>
                      handleSelectChange(item.id, "couleur", e.target.value)
                    }
                  >
                    {item.colors?.map((c, i) => (
                      <option key={i}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="attr">
                  <label>Quantité :</label>
                  <select
                    onChange={(e) =>
                      handleSelectChange(item.id, "quantité", e.target.value)
                    }
                  >
                    {[1, 2, 3, 4, 5].map((q) => (
                      <option key={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prix */}
              <div className="item-prices">
                <span className="current-price">
                  {item.price.toLocaleString()} FCFA
                </span>
                {item.oldPrice && (
                  <>
                    <span className="old-price">
                      {item.oldPrice.toLocaleString()} FCFA
                    </span>
                    <span className="discount">-{reduction}%</span>
                  </>
                )}
              </div>
            </div>

            {/* Supprimer */}
            <FaTrash className="delete-icon" onClick={() => handleRemove(item.id)} />
          </div>
        );
      })}
    </div>
  );
};

export default CartItems;
