import React from "react";
import "./productloading.scss";

export const ProductLoading = () => {
  // On peut afficher 4 placeholders
  const placeholders = Array(4).fill(0);

  return (
    <div className="product-loading-container">
      {placeholders.map((_, index) => (
        <div key={index} className="product-skeleton">
          <div className="skeleton-image"></div>
          <div className="skeleton-text skeleton-title"></div>
          <div className="skeleton-text skeleton-desc"></div>
          <div className="skeleton-text skeleton-price"></div>
        </div>
      ))}
    </div>
  );
};