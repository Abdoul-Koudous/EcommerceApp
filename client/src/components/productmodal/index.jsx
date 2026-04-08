import React, { useState, useEffect } from "react";
import {
  FaStar,
  FaHeart,
  FaCartPlus,
  FaBalanceScale,
  FaTimes,
} from "react-icons/fa";
import ProductZoom from "../productzoom";
import "./productpopup.scss";

const ProductPopup = ({ product, onClose }) => {
  const [quantity, setQuantity] = useState(1);

  // ✅ STATES pour les caractéristiques
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedRam, setSelectedRam] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(null);

  // ✅ INIT : prendre la première option disponible par défaut
  useEffect(() => {
    if (product.size?.length > 0) setSelectedSize(product.size[0]);
    if (product.colors?.length > 0) setSelectedColor(product.colors[0]);
    if (product.productRam?.length > 0) setSelectedRam(product.productRam[0]);
    if (product.productWeight?.length > 0)
      setSelectedWeight(product.productWeight[0]);
  }, [product]);

  // Quantité
  const handleIncrement = () => setQuantity(quantity + 1);
  const handleDecrement = () =>
    setQuantity(quantity > 1 ? quantity - 1 : 1);

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="container2">
          {/* Images */}
          <div className="productzoomcont">
            {product.images?.length > 0 && <ProductZoom images={product.images} />}
          </div>

          {/* Infos */}
          <div className="productcont">
            <h2 className="product-title">{product.name}</h2>

            {/* Marque + rating */}
            {(product.brand || product.rating) && (
              <div className="brand-rating">
                {product.brand && <span className="brand">Marque: {product.brand}</span>}
                {product.rating != null && (
                  <div className="rating">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        color={i < product.rating ? "#FFD700" : "#ccc"}
                        size={16}
                      />
                    ))}
                    <span className="reviews">({product.rating} Avis)</span>
                  </div>
                )}
              </div>
            )}

            {/* Prix et stock */}
            <div className="price-stock">
              {product.oldPrice && <span className="old-price">{product.oldPrice} FCFA</span>}
              {product.price && <span className="price">{product.price} FCFA</span>}
              {product.countIntStock != null && (
                <span className="stock">
                  {product.countIntStock > 0
                    ? `En stock (${product.countIntStock})`
                    : "Indisponible"}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && <p className="desc">{product.description}</p>}

            {/* Options (tailles, couleurs, RAM, poids) */}
            <div className="characteristics">
              {product.size?.length > 0 && (
                <div className="option-group">
                  <span className="option-label">Tailles:</span>
                  {product.size.map((size, i) => (
                    <button
                      key={i}
                      className={`option-btn ${size === selectedSize ? "active" : ""}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}

              {product.colors?.length > 0 && (
                <div className="option-group">
                  <span className="option-label">Couleurs:</span>
                  {product.colors.map((color, i) => (
                    <button
                      key={i}
                      className={`option-btn ${color === selectedColor ? "active" : ""}`}
                      style={{ backgroundColor: color.toLowerCase() }}
                      onClick={() => setSelectedColor(color)}
                    >
                      {color === selectedColor ? "✓" : ""}
                    </button>
                  ))}
                </div>
              )}

              {product.productRam?.length > 0 && (
                <div className="option-group">
                  <span className="option-label">RAM:</span>
                  {product.productRam.map((ram, i) => (
                    <button
                      key={i}
                      className={`option-btn ${ram === selectedRam ? "active" : ""}`}
                      onClick={() => setSelectedRam(ram)}
                    >
                      {ram}
                    </button>
                  ))}
                </div>
              )}

              {product.productWeight?.length > 0 && (
                <div className="option-group">
                  <span className="option-label">Poids:</span>
                  {product.productWeight.map((w, i) => (
                    <button
                      key={i}
                      className={`option-btn ${w === selectedWeight ? "active" : ""}`}
                      onClick={() => setSelectedWeight(w)}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}

              {/* Ligne dynamique des caractéristiques sélectionnées */}
              <div className="selected-characteristics">
                { [selectedSize, selectedColor, selectedRam, selectedWeight]
                    .filter(Boolean)
                    .join(" | ") }
              </div>
            </div>

            {/* Quantité */}
            <div className="cart-actions">
              <div className="quantity">
                <button onClick={handleDecrement}>-</button>
                <span>{quantity}</span>
                <button onClick={handleIncrement}>+</button>
              </div>

              <button className="add-to-cart">
                <FaCartPlus /> Ajouter au panier
              </button>
            </div>

            {/* Actions */}
            <div className="extra-actions">
              <button className="wishlist">
                <FaHeart /> Favoris
              </button>

              <button className="compare">
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