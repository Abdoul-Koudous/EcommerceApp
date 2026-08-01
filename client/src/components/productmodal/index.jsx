import React, { useState, useEffect } from "react";
import {
  FaStar,
  FaRegStar,
  FaHeart,
  FaCartPlus,
  FaBalanceScale,
  FaTimes,
} from "react-icons/fa";
import ProductZoom from "../productzoom";
import "./productpopup.scss";

const ProductPopup = ({ product, onClose, addToCart, user }) => {
  const [quantity, setQuantity] = useState(1);

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedRam, setSelectedRam] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(null);

  const isOutOfStock = !product?.countIntStock || product.countIntStock <= 0;

  const handleAddToCart = () => {
    console.log("CLICK ADD", {
      selectedSize,
      selectedColor,
      selectedRam,
      selectedWeight,
    });

    if (isOutOfStock) {
      alert("Ce produit est en rupture de stock");
      return;
    }

    if (product.size?.length > 0 && !selectedSize) {
      alert("Choisissez une taille");
      return;
    }

    if (product.colors?.length > 0 && !selectedColor) {
      alert("Choisissez une couleur");
      return;
    }

    if (product.productRam?.length > 0 && !selectedRam) {
      alert("Choisissez une RAM");
      return;
    }

    if (product.productWeight?.length > 0 && !selectedWeight) {
      alert("Choisissez un poids");
      return;
    }

    addToCart(product._id, user?._id, quantity, {
      size: selectedSize,
      color: selectedColor,
      ram: selectedRam,
      weight: selectedWeight,
    });

    onClose();
  };

  const handleIncrement = () => {
    if (isOutOfStock) return;
    setQuantity((q) => Math.min(q + 1, product.countIntStock));
  };
  const handleDecrement = () =>
    setQuantity(quantity > 1 ? quantity - 1 : 1);

  return (
    <div className="pp-overlay">
      <div className="pp-content">
        <button className="pp-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="pp-container">
          {/* Images */}
          <div className="pp-zoom-cont">
            {product.images?.length > 0 && <ProductZoom images={product.images} />}
          </div>

          {/* Infos */}
          <div className="pp-info-cont">
            <h2 className="pp-title">{product.name}</h2>

            {/* Marque + rating */}
            {(product.brand || product.rating) && (
              <div className="pp-brand-rating">
                {product.brand && <span className="pp-brand">Marque: {product.brand}</span>}
                {product.rating != null && (
                  <div className="pp-rating">
                    {[...Array(5)].map((_, i) => (
                      i < product.rating ? (
                        <FaStar key={i} className="pp-star-filled" size={16} />
                      ) : (
                        <FaRegStar key={i} className="pp-star-empty" size={16} />
                      )
                    ))}
                    <span className="pp-reviews">({product.rating} Avis)</span>
                  </div>
                )}
              </div>
            )}

            {/* Prix et stock */}
            <div className="pp-price-stock">
              {product.oldPrice && <span className="pp-old-price">{product.oldPrice} FCFA</span>}
              {product.price && <span className="pp-price">{product.price} FCFA</span>}
              {product.countIntStock != null && (
                <span className={`pp-stock ${product.countIntStock > 0 ? "pp-in-stock" : "pp-out-of-stock"}`}>
                  {product.countIntStock > 0
                    ? `En stock (${product.countIntStock})`
                    : "Indisponible"}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && <p className="pp-desc">{product.description}</p>}

            {/* Options */}
            <div className="pp-characteristics">
              {product.size?.length > 0 && (
                <div className="pp-option-group">
                  <span className="pp-option-label">Tailles:</span>
                  {product.size.map((size, i) => (
                    <button
                      key={i}
                      className={`pp-option-btn ${size === selectedSize ? "pp-active" : ""}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}

              {product.colors?.length > 0 && (
                <div className="pp-option-group">
                  <span className="pp-option-label">Couleurs:</span>
                  {product.colors.map((color, i) => (
                    <button
                      key={i}
                      className={`pp-option-btn ${color === selectedColor ? "pp-active" : ""}`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      onClick={() => setSelectedColor(color)}
                    >
                      {color === selectedColor ? "✓" : ""}
                    </button>
                  ))}
                </div>
              )}

              {product.productRam?.length > 0 && (
                <div className="pp-option-group">
                  <span className="pp-option-label">RAM:</span>
                  {product.productRam.map((ram, i) => (
                    <button
                      key={i}
                      className={`pp-option-btn ${ram === selectedRam ? "pp-active" : ""}`}
                      onClick={() => setSelectedRam(ram)}
                    >
                      {ram}
                    </button>
                  ))}
                </div>
              )}

              {product.productWeight?.length > 0 && (
                <div className="pp-option-group">
                  <span className="pp-option-label">Poids:</span>
                  {product.productWeight.map((w, i) => (
                    <button
                      key={i}
                      className={`pp-option-btn ${w === selectedWeight ? "pp-active" : ""}`}
                      onClick={() => setSelectedWeight(w)}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}

              <div className="pp-selected-characteristics">
                { [selectedSize, selectedColor, selectedRam, selectedWeight]
                    .filter(Boolean)
                    .join(" | ") }
              </div>
            </div>

            {/* Quantité */}
            <div className="pp-cart-actions">
              <div className="pp-quantity">
                <button onClick={handleDecrement} disabled={isOutOfStock}>-</button>
                <span>{quantity}</span>
                <button onClick={handleIncrement} disabled={isOutOfStock}>+</button>
              </div>

              <button className="pp-add-cart" onClick={handleAddToCart} disabled={isOutOfStock}>
                <FaCartPlus /> Ajouter au panier
              </button>
            </div>

            {/* Actions */}
            <div className="pp-extra-actions">
              <button className="pp-wishlist">
                <FaHeart /> Favoris
              </button>

              <button className="pp-compare">
                <FaBalanceScale /> Comparer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPopup;