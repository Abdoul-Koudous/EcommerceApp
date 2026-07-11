import React, { useContext, useState } from "react";
import { FaTrash, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "./wishlisttabitems.scss";
import { ToastContext } from "../../context/ToastContext";
import { deleteData } from "../utils/api";

const WishlistTabitemsItems = ({ items = [], onRemoved }) => {
  const navigate = useNavigate();
  const { openToast } = useContext(ToastContext);
  const [removingId, setRemovingId] = useState(null);

  const handleRemove = async (productId) => {
    if (removingId) return;

    setRemovingId(productId);

    try {
      const res = await deleteData(`/api/mylist/remove/${productId}`);

      if (res?.success) {
        openToast?.("success", res?.message || "Retiré des favoris");
        onRemoved?.();
      } else {
        openToast?.("error", res?.message || "Erreur suppression");
      }
    } catch (err) {
      openToast?.("error", "Erreur serveur");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="cart-items">
      {items.map((item) => {
        const reduction =
          item.oldPrice && item.price
            ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)
            : 0;

        return (
          <div className="cart-item" key={item._id}>
            <img
              src={item.image || "/placeholder.png"}
              alt={item.productTitle}
              className="clickable-img"
              onClick={() => navigate(`/product/${item.productId}`)}
            />

            <div className="item-details">
              <span className="item-category">{item.brand || "Informatique"}</span>

              <h4
                className="item-title clickable-title"
                onClick={() => navigate(`/product/${item.productId}`)}
              >
                {item.productTitle}
              </h4>

              <div className="item-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={i < item.rating ? "star active" : "star"} />
                ))}
              </div>

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

            <FaTrash
              className={`delete-icon ${removingId === item.productId ? "disabled" : ""}`}
              onClick={() => handleRemove(item.productId)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default WishlistTabitemsItems;