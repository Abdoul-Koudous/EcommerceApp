import React, { useState } from "react";
import { FaStar, FaHeart, FaCartPlus, FaBalanceScale, FaTimes } from "react-icons/fa";
import ProductZoom from "../productzoom";
import "./productpopup.scss";

const ProductPopup = ({ product, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);

  const handleIncrement = () => setQuantity(quantity + 1);
  const handleDecrement = () => setQuantity(quantity > 1 ? quantity - 1 : 1);

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="container2">
          {/* Zoom + miniatures */}
          <div className="productzoomcont">
            <ProductZoom images={product.images} />
          </div>

          {/* Détails du produit */}
          <div className="productcont">
            <h2 className="product-title">{product.title}</h2>

            <div className="brand-rating">
              <span className="brand">Marque: {product.brand}</span>
              <div className="rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} color={i < product.rating ? "#FFD700" : "#ccc"} size={16} />
                ))}
                <span className="reviews">({product.reviews} Avis)</span>
              </div>
            </div>

            <div className="price-stock">
              {product.oldPrice && <span className="old-price">{product.oldPrice} FCFA</span>}
              <span className="price">{product.price} FCFA</span>
              <span className="stock">{product.stock ? "In stock" : "Out of stock"}</span>
            </div>

            <p className="desc">{product.desc}</p>

            <div className="characteristics">
              <div className="option-group">
                <span className="option-label">Size:</span>
                {["S", "M", "L", "XL"].map((size) => (
                  <button
                    key={size}
                    className={`option-btn ${size === selectedSize ? "active" : ""}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <div className="option-group">
                <span className="option-label">Colors:</span>
                {product.colors.map((color) => (
                  <button
                    key={color}
                    className={`option-btn ${color === selectedColor ? "active" : ""}`}
                    style={{ backgroundColor: color.toLowerCase() }}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color === selectedColor ? "✓" : ""}
                  </button>
                ))}
              </div>
            </div>

            <div className="shipping">Free shipping: {product.shippingDays} days</div>

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

            <div className="extra-actions">
              <button className="wishlist">
                <FaHeart /> Ajouter aux favoris
              </button>
              <button className="compare">
                <FaBalanceScale /> Add to compare
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPopup;
