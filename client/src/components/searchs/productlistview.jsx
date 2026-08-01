import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaEye,
  FaExchangeAlt,
  FaHeart,
  FaStar,
  FaRegStar,
  FaCartPlus,
} from "react-icons/fa";
import "./productlistview.scss";
import ProductPopup from "../productmodal";

const ProductItemView = ({ product }) => {
  const [hovered, setHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const handleOpenPopup = () => setShowPopup(true);
  const handleClosePopup = () => setShowPopup(false);

  const {
    _id,
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
        className="pil-item"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image */}
        <div
          className="pil-img-box"
          onClick={() => navigate(`/product/${_id}`)}
        >
          <img src={hovered && images[1] ? images[1] : images[0]} alt={name} />

          {discount > 0 && <div className="pil-discount-badge">-{discount}%</div>}
          {isNew && <div className="pil-new-badge">Nouveau</div>}

          <div className={`pil-icon-overlay ${hovered ? "pil-show" : ""}`}>
            <button
              className="pil-icon pil-compare"
              title="Comparer"
              onClick={(e) => e.stopPropagation()}
            >
              <FaExchangeAlt />
            </button>
            <button
              className="pil-icon pil-view"
              title="Voir le produit"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPopup();
              }}
            >
              <FaEye />
            </button>
            <button
              className="pil-icon pil-zoom"
              title="Zoom"
              onClick={(e) => e.stopPropagation()}
            >
              <FaSearch />
            </button>
            <button
              className="pil-icon pil-favorite"
              title="Favori"
              onClick={(e) => e.stopPropagation()}
            >
              <FaHeart />
            </button>
          </div>
        </div>

        {/* Détails du produit */}
        <div className="pil-details">
          <p className="pil-category">
            {category?.name || "Catégorie"}
          </p>
          <h4
            className="pil-title-link"
            onClick={() => navigate(`/product/${_id}`)}
          >
            {name}
          </h4>
          <p className="pil-desc">{description}</p>

          <div className="pil-rating">
            {[...Array(5)].map((_, i) => (
              i < rating ? (
                <FaStar key={i} className="pil-star-filled" size={16} />
              ) : (
                <FaRegStar key={i} className="pil-star-empty" size={16} />
              )
            ))}
          </div>

          <div className="pil-price-box">
            {oldPrice && <span className="pil-old-price">{oldPrice} FCFA</span>}
            <span className="pil-price">{price} FCFA</span>
          </div>

          <button
            className="pil-add-to-cart-btn"
            onClick={(e) => e.stopPropagation()}
          >
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