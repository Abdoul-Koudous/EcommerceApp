import React from "react";
import { FaStar } from "react-icons/fa";
import "./hoverRating.scss";

const HoverRating = ({ value = 0, onChange }) => {
  return (
    <div className="hover-rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <FaStar
          key={i}
          className={`star ${i <= value ? "full" : "empty"}`}
          onClick={() => onChange(i)}
          onMouseEnter={() => onChange(i)}
        />
      ))}
      <span className="rating-value">{value}</span>
    </div>
  );
};

export default HoverRating;
