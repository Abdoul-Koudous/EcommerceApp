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


const ProductItemView = ({
  image1,
  image2,
  title,
  desc,
  price,
  oldPrice,
  rating,
  discount,
  isNew,
  brand = "YeboShop", // par défaut
  colors = ["Red", "Blue", "Black"],
  stock = true,
  shippingDays = 3,
  reviews = 5,
}) => {
  const [hovered, setHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false); // ✅ état pour le popup

  const handleOpenPopup = () => setShowPopup(true);
  const handleClosePopup = () => setShowPopup(false);

  const productData = {
    title,
    desc,
    price,
    oldPrice,
    rating,
    discount,
    isNew,
    brand,
    colors,
    stock,
    shippingDays,
    reviews,
    images: [image1, image2],
  };

  return (
    <>
      <div
        className="product-item-list"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Bloc image */}
        <div className="img-box">
          <img src={hovered && image2 ? image2 : image1} alt={title} />

          {/* Badge de réduction */}
          {discount && <div className="discount-badge">-{discount}%</div>}

          {/* Badge Nouveau */}
          {isNew && <div className="new-badge">Nouveau</div>}

          {/* Icônes flottantes au hover */}
          <div className={`icon-overlay ${hovered ? "show" : ""}`}>
            <button className="icon compare" title="Comparer">
              <FaExchangeAlt />
            </button>
            <button
              className="icon view"
              title="Voir le produit"
              onClick={handleOpenPopup} // ✅ ouvre le popup
            >
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

        {/* Bloc Détails */}
        <div className="details">
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

          <button className="add-to-cart-btn">
            <FaCartPlus style={{ marginRight: "5px" }} />
            Ajouter au panier
          </button>
        </div>
      </div>

      {/* ✅ Le Popup s’affiche ici quand showPopup est true */}
      {showPopup && (
        <ProductPopup
          product={productData}
          onClose={handleClosePopup} // fonction pour fermer
        />
      )}
    </>
  );
};

export default ProductItemView;
