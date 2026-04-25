import React, { useState } from "react";
import {
  FaSearch,
  FaEye,
  FaExchangeAlt,
  FaHeart,
  FaStar,
  FaCartPlus,
} from "react-icons/fa";
import "./productlistview.scss";
import ProductPopup from "../productmodal";

const ProductItemView = ({ product }) => {
  const [hovered, setHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleOpenPopup = () => setShowPopup(true);
  const handleClosePopup = () => setShowPopup(false);

  // Déstructuration directe des données du produit
  const {
  name,
  description,
  price,
  oldPrice,
  rating = 0,
  discount = 0,
  isNew = false,
  images = [],
  category,
} = product;

  return (
    <>
      <div
        className="product-item-list"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image */}
        <div className="img-box">
          <img src={hovered && images[1] ? images[1] : images[0]} alt={name} />

          {discount > 0 && <div className="discount-badge">-{discount}%</div>}
          {isNew && <div className="new-badge">Nouveau</div>}

          <div className={`icon-overlay ${hovered ? "show" : ""}`}>
            <button className="icon compare" title="Comparer">
              <FaExchangeAlt />
            </button>
            <button className="icon view" title="Voir le produit" onClick={handleOpenPopup}>
              <FaEye />
            </button>
            <button className="icon zoom" title="Zoom">
              <FaSearch />
            </button>
            <button className="icon favorite" title="Favori">
              <FaHeart />
            </button>
          </div>
        </div>

        {/* Détails du produit */}
        <div className="details">
          <p className="category">
          {category?.name || "Catégorie"}
        </p>
          <h4>{name}</h4>
          <p className="desc">{description}</p>

          <div className="rating">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} color={i < rating ? "#FFD700" : "#ccc"} size={16} />
            ))}
          </div>

          <div className="price-box">
            {oldPrice && <span className="old-price">{oldPrice} FCFA</span>}
            <span className="price">{price} FCFA</span>
          </div>

          <button className="add-to-cart-btn">
            <FaCartPlus style={{ marginRight: "5px" }} />
            Ajouter au panier
          </button>
        </div>
      </div>

      {/* Popup */}
      {showPopup && <ProductPopup product={product} onClose={handleClosePopup} />}
    </>
  );
};

export default ProductItemView;