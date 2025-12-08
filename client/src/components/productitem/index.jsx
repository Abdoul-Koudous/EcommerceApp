import React, { useState } from "react";
import { FaStar, FaSearch, FaEye, FaExchangeAlt, FaHeart } from "react-icons/fa";
import "./productitem.scss";
import ProductPopup from "../productmodal";

const ProductItem = (props) => {
  const {
    image1,
    image2,
    title,
    desc,
    price,
    oldPrice,
    discount,
    rating,
    isNew
  } = props;

  const [hovered, setHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const productData = {
    title,
    desc,
    price,
    oldPrice,
    rating,
    isNew,
    brand: "ProBrand",
    reviews: 12,
    stock: true,
    colors: ["Black", "Blue"],
    shippingDays: 3,
    images: [image1, image2, "/od13.jpg", image2, image2, image2, image2, image2],
  };

  return (
    <>
      <div
        className="product-item"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="img-box">
          <img src={hovered ? image2 : image1} alt={title} />
          {discount && <div className="discount-badge">-{discount}%</div>}
          {isNew && <div className="new-badge">Nouveau</div>}

          <div className={`icon-overlay ${hovered ? "show" : ""}`}>
            <button className="icon compare" title="Comparer">
              <FaExchangeAlt />
            </button>
            <button className="icon view" title="Voir" onClick={() => setShowPopup(true)}>
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

        <h4>{title}</h4>
        <p className="desc">{desc}</p>
        <div className="rating">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} color={i < rating ? "#FFD700" : "#ccc"} size={16} />
          ))}
        </div>
        <div className="price-box">
          {oldPrice && <span className="old-price">{oldPrice} FCFA</span>}
          <span className="price">{price} FCFA</span>
        </div>
      </div>

      {showPopup && (
        <ProductPopup
          product={productData}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
};

export default ProductItem;
