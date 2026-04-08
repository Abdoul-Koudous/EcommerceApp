import React, { useState } from "react";
import { FaStar, FaSearch, FaEye, FaExchangeAlt, FaHeart } from "react-icons/fa";
import "./productitem.scss";
import ProductPopup from "../productmodal";

const ProductItem = ({ product }) => {
  const [hovered, setHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 🔹 Images provenant uniquement de la base
  const images = product.images || [];

  const truncateName = (name, maxWords = 3) => {
    if (!name) return "";
    const words = name.split(" ");
    return words.length <= maxWords ? name : words.slice(0, maxWords).join(" ") + "...";
  };

  const isNewProduct = (date) => {
    if (!date) return false;
    const now = new Date();
    const createdDate = new Date(date);
    const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 7; // produit nouveau si <= 7 jours
  };

  return (
    <>
      <div
        className="product-item"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="img-box">
          {images.length > 0 ? (
    <>
      {!imageLoaded && <div className="skeleton-image"></div>}
      <img
        src={hovered && images[1] ? images[1] : images[0]}
        alt={product.name}
        style={{ display: imageLoaded ? "block" : "none" }}
        onLoad={() => setImageLoaded(true)}
      />
    </>
  ) : (
    <div className="no-image">Pas d'image</div>
  )}

          {product.discount > 0 && <div className="discount-badge">-{product.discount}%</div>}
          {isNewProduct(product.dateCreated) && <div className="new-badge">Nouveau</div>}

          <div className={`icon-overlay ${hovered ? "show" : ""}`}>
            <button className="icon compare"><FaExchangeAlt /></button>
            <button className="icon view" onClick={() => setShowPopup(true)}><FaEye /></button>
            <button className="icon zoom"><FaSearch /></button>
            <button className="icon favorite"><FaHeart /></button>
          </div>
        </div>

        <h4>{truncateName(product.name)}</h4>
        <p className="desc">{product.brand || "Sans marque"}</p>

        <div className="rating">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} color={i < (product.rating || 0) ? "#FFD700" : "#ccc"} size={16} />
          ))}
        </div>

        <div className="price-box">
          {product.oldPrice && <span className="old-price">{product.oldPrice} FCFA</span>}
          <span className="price">{product.price} FCFA</span>
        </div>
      </div>

      {showPopup && (
        <ProductPopup product={product} onClose={() => setShowPopup(false)} />
      )}
    </>
  );
};

export default ProductItem;