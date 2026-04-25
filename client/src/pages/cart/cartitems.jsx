import React, { useContext } from "react";
import { FaTrash, FaStar } from "react-icons/fa";
import { UserContext } from "../../UserContext/UserContext";
import { deleteData, editData } from "../../pages/utils/api";
import "./cartitems.scss";

const CartItems = () => {
  const { cartItems, loadCartItems } = useContext(UserContext);

  const handleRemove = (id) => {
    deleteData(`/api/cart/delete-cart-item/${id}`)
      .then(() => loadCartItems())
      .catch(() => console.log("Erreur suppression"));
  };

  const handleUpdate = (id, data) => {
    editData("/api/cart/update-qty", {
      _id: id,
      ...data,
    })
      .then(() => loadCartItems())
      .catch(() => console.log("Erreur update"));
  };

  return (
    <div className="cart-items">
      {cartItems?.length === 0 && (
        <div className="empty-cart">
    <img
      src="/empty-cart.png"
      alt="Panier vide"
      className="empty-cart-img"
    />

    <p className="empty-text">
      Votre panier est vide pour le moment
    </p>

    <button
      className="continue-btn"
      onClick={() => window.history.back()}
    >
      Continuer les achats
    </button>
  </div>
      )}

      {cartItems?.length > 0 &&
  cartItems.map((item) => {
        const reduction =
          item.oldPrice && item.price
            ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)
            : 0;

        // ✅ ICI : maxQty par item
        const maxQty = Math.min(item.countInStock || 1, 20);

        return (
          <div className="cart-item" key={item._id}>
            <img src={item.image || "/placeholder.png"} alt="" />

            <div className="item-details">
              <h4>{item.productTitle}</h4>

              <div className="item-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={i < (item.rating || 0) ? "star active" : "star"}
                  />
                ))}
              </div>

              {/* OPTIONS */}
              <div className="item-attributes">
                {item.sizeOptions?.length > 0 && (
                  <div className="attr">
                    <label>Taille :</label>
                    <select
                      value={item.size || ""}
                      onChange={(e) =>
                        handleUpdate(item._id, { size: e.target.value })
                      }
                    >
                      <option value="">Choisir</option>
                      {item.sizeOptions.map((s, i) => (
                        <option key={i} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {item.colorOptions?.length > 0 && (
                  <div className="attr">
                    <label>Couleur :</label>
                    <select
                      value={item.color || ""}
                      onChange={(e) =>
                        handleUpdate(item._id, { color: e.target.value })
                      }
                    >
                      <option value="">Choisir</option>
                      {item.colorOptions.map((c, i) => (
                        <option key={i} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {item.ramOptions?.length > 0 && (
                  <div className="attr">
                    <label>RAM :</label>
                    <select
                      value={item.ram || ""}
                      onChange={(e) =>
                        handleUpdate(item._id, { ram: e.target.value })
                      }
                    >
                      <option value="">Choisir</option>
                      {item.ramOptions.map((r, i) => (
                        <option key={i} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {item.weightOptions?.length > 0 && (
                  <div className="attr">
                    <label>Poids :</label>
                    <select
                      value={item.weight || ""}
                      onChange={(e) =>
                        handleUpdate(item._id, { weight: e.target.value })
                      }
                    >
                      <option value="">Choisir</option>
                      {item.weightOptions.map((w, i) => (
                        <option key={i} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* QUANTITY FIX */}
              <div className="attr">
                <label>Quantité :</label>
                <select
                  value={item.quantity}
                  onChange={(e) =>
                    handleUpdate(item._id, { qty: e.target.value })
                  }
                >
                  {[...Array(maxQty)].map((_, i) => {
                    const q = i + 1;
                    return (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    );
                  })}
                </select>
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
              className="delete-icon"
              onClick={() => handleRemove(item._id)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default CartItems;