import React from "react";
import { FaStar } from "react-icons/fa";
import "./hoverRating.scss";

const HoverRating = ({ rating = 0, onChange }) => {
  const handleChange = (value) => {
    if (onChange) onChange(value);
  };

  return (
    <div className="hover-rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <FaStar
          key={i}
          className={`star ${i <= rating ? "full" : "empty"}`}
          onClick={() => handleChange(i)}
          onMouseEnter={() => handleChange(i)}
        />
      ))}
      <span className="rating-value">{rating}</span>
    </div>
  );
};

export default HoverRating;
