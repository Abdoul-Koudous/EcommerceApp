import React from "react";
import "./categorySkeleton.scss";

export const CategorySkeleton = ({ count = 5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="cat-card skeleton">
          <div className="skeleton-img"></div>
          <div className="skeleton-name"></div>
        </div>
      ))}
    </>
  );
};