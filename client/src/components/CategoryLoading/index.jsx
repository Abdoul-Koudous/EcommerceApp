import React from "react";
import "./CategoryLoading.scss";

export const CategoryLoading = () => {
  return (
    <div className="categories-loading">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="skeleton-category"></div>
      ))}
    </div>
  );
};