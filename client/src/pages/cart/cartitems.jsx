import React, { useContext } from "react";
import { FaTrash, FaStar, FaRegStar } from "react-icons/fa";
import { UserContext } from "../../UserContext/UserContext";
import { deleteData, editData } from "../../pages/utils/api";
import { getSessionId } from "../utils/tracking";
import "./cartitems.scss";

const resolveVariantCombination = (product, selectedVariants) => {
  if (
    !product?.hasVariants ||
    !selectedVariants ||
    Object.keys(selectedVariants).length === 0
  ) {
    return null;
  }
  return (
    product.variantCombinations?.find((combo) => {
      const comboObj = combo.combination || {};
      return (
        Object.keys(selectedVariants).length === Object.keys(comboObj).length &&
        Object.entries(selectedVariants).every(
          ([key, val]) => comboObj[key] === val,
        )
      );
    }) || null
  );
};

const CartItems = () => {
  // ✅ NOUVEAU : besoin de user pour savoir si on doit passer guestSessionId
  const { user, cartItems, loadCartItems } = useContext(UserContext);

  const handleRemove = (id) => {
    // ✅ NOUVEAU : DELETE n'a pas de body — le guestSessionId doit être
    // passé en query string pour que buildOwnerFilter le retrouve côté serveur.
    const url = user?._id
      ? `/api/cart/delete-cart-item/${id}`
      : `/api/cart/delete-cart-item/${id}?guestSessionId=${getSessionId()}`;

    deleteData(url)
      .then(() => loadCartItems())
      .catch(() => console.log("Erreur suppression"));
  };

  const handleUpdate = (id, data) => {
    editData("/api/cart/update-qty", {
      _id: id,
      ...data,
      // ✅ NOUVEAU
      guestSessionId: user?._id ? undefined : getSessionId(),
    })
      .then(() => loadCartItems())
      .catch(() => console.log("Erreur update"));
  };

  return (
    <div className="cp-items">
      {cartItems?.length === 0 && (
        <div className="cp-empty-cart">
          <img
            src="/empty-cart.png"
            alt="Panier vide"
            className="cp-empty-cart-img"
          />

          <p className="cp-empty-text">
            Votre panier est vide pour le moment
          </p>

          <button
            className="cp-continue-btn"
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

          const liveProduct = item.productId;
          const isProductDeleted = !liveProduct;

          const itemSelectedVariants = item.selectedVariants
            ? item.selectedVariants instanceof Map
              ? Object.fromEntries(item.selectedVariants)
              : item.selectedVariants
            : {};

          const hasNewVariants =
            !isProductDeleted &&
            liveProduct.hasVariants &&
            Object.keys(itemSelectedVariants).length > 0;

          const matchedCombo = hasNewVariants
            ? resolveVariantCombination(liveProduct, itemSelectedVariants)
            : null;

          const realStock = isProductDeleted
            ? 0
            : liveProduct.hasVariants && liveProduct.useVariantStock
              ? (matchedCombo?.stock ?? 0)
              : (liveProduct.countIntStock ?? item.countInStock ?? 0);

          const maxQty = Math.max(realStock, 0);
          const isOutOfStock = maxQty === 0;
          const isQuantityTooHigh = !isOutOfStock && item.quantity > maxQty;

          const availableSizes =
            liveProduct?.size?.length > 0 ? liveProduct.size : item.sizeOptions || [];
          const availableColors =
            liveProduct?.colors?.length > 0 ? liveProduct.colors : item.colorOptions || [];
          const availableRams =
            liveProduct?.productRam?.length > 0 ? liveProduct.productRam : item.ramOptions || [];
          const availableWeights =
            liveProduct?.productWeight?.length > 0
              ? liveProduct.productWeight
              : item.weightOptions || [];

          const isSizeStale = item.size && !availableSizes.includes(item.size);
          const isColorStale = item.color && !availableColors.includes(item.color);
          const isRamStale = item.ram && !availableRams.includes(item.ram);
          const isWeightStale = item.weight && !availableWeights.includes(item.weight);

          return (
            <div className="cp-item" key={item._id}>
              <img src={item.image || "/placeholder.png"} alt="" />

              <div className="cp-item-details">
                <h4>{item.productTitle}</h4>

                <div className="cp-item-rating">
                  {[...Array(5)].map((_, i) => (
                    i < (item.rating || 0) ? (
                      <FaStar key={i} className="cp-star-filled" />
                    ) : (
                      <FaRegStar key={i} className="cp-star-empty" />
                    )
                  ))}
                </div>

                {isProductDeleted && (
                  <p className="cp-stock-warning">
                    Ce produit n'est plus disponible.
                  </p>
                )}

                {!isProductDeleted && liveProduct.hasVariants && (
                  <div className="cp-item-attributes">
                    {Object.entries(itemSelectedVariants).map(([key, val]) => (
                      <p key={key} className="cp-variant-line">
                        <strong>{key} :</strong> {val}
                      </p>
                    ))}
                    {matchedCombo && !matchedCombo.isActive && (
                      <p className="cp-stock-warning">
                        Cette variante n'est plus disponible.
                      </p>
                    )}
                  </div>
                )}

                {!isProductDeleted && !liveProduct.hasVariants && (
                  <div className="cp-item-attributes">
                    {availableSizes.length > 0 && (
                      <div className="cp-attr">
                        <label>Taille :</label>
                        <select
                          value={item.size || ""}
                          onChange={(e) =>
                            handleUpdate(item._id, { size: e.target.value })
                          }
                        >
                          <option value="">Choisir</option>
                          {availableSizes.map((s, i) => (
                            <option key={i} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        {isSizeStale && (
                          <p className="cp-stock-warning">
                            "{item.size}" n'est plus disponible, choisis-en une autre.
                          </p>
                        )}
                      </div>
                    )}

                    {availableColors.length > 0 && (
                      <div className="cp-attr">
                        <label>Couleur :</label>
                        <select
                          value={item.color || ""}
                          onChange={(e) =>
                            handleUpdate(item._id, { color: e.target.value })
                          }
                        >
                          <option value="">Choisir</option>
                          {availableColors.map((c, i) => (
                            <option key={i} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        {isColorStale && (
                          <p className="cp-stock-warning">
                            "{item.color}" n'est plus disponible, choisis-en une autre.
                          </p>
                        )}
                      </div>
                    )}

                    {availableRams.length > 0 && (
                      <div className="cp-attr">
                        <label>RAM :</label>
                        <select
                          value={item.ram || ""}
                          onChange={(e) =>
                            handleUpdate(item._id, { ram: e.target.value })
                          }
                        >
                          <option value="">Choisir</option>
                          {availableRams.map((r, i) => (
                            <option key={i} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        {isRamStale && (
                          <p className="cp-stock-warning">
                            "{item.ram}" n'est plus disponible, choisis-en une autre.
                          </p>
                        )}
                      </div>
                    )}

                    {availableWeights.length > 0 && (
                      <div className="cp-attr">
                        <label>Poids :</label>
                        <select
                          value={item.weight || ""}
                          onChange={(e) =>
                            handleUpdate(item._id, { weight: e.target.value })
                          }
                        >
                          <option value="">Choisir</option>
                          {availableWeights.map((w, i) => (
                            <option key={i} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                        {isWeightStale && (
                          <p className="cp-stock-warning">
                            "{item.weight}" n'est plus disponible, choisis-en une autre.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!isProductDeleted && (
                  <div className="cp-attr">
                    <label>Quantité :</label>
                    {isOutOfStock ? (
                      <span className="cp-stock-warning">Rupture de stock</span>
                    ) : (
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
                    )}
                  </div>
                )}

                {isQuantityTooHigh && (
                  <p className="cp-stock-warning">
                    Seulement {maxQty} en stock — pense à ajuster la quantité.
                  </p>
                )}

                <div className="cp-item-prices">
                  <span className="cp-current-price">
                    {item.price.toLocaleString()} FCFA
                  </span>

                  {item.oldPrice && (
                    <>
                      <span className="cp-old-price">
                        {item.oldPrice.toLocaleString()} FCFA
                      </span>
                      <span className="cp-discount">-{reduction}%</span>
                    </>
                  )}
                </div>
              </div>

              <FaTrash
                className="cp-delete-icon"
                onClick={() => handleRemove(item._id)}
              />
            </div>
          );
        })}
    </div>
  );
};

export default CartItems;