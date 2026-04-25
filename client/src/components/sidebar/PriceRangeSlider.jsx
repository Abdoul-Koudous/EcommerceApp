import React, { useState, useEffect } from "react";
import "./priceRangeSlider.scss";

const PriceRangeSlider = ({ min = 0, max = 1000, onChange }) => {
  const [minVal, setMinVal] = useState(min);
  const [maxVal, setMaxVal] = useState(max);

  useEffect(() => {
    onChange?.({ min: minVal, max: maxVal });
  }, [minVal, maxVal]);

  return (
    <div className="price-slider">
      <h4>Filtrer par prix</h4>

      <div className="values">
        <span>{minVal} FCFA</span>
        <span>{maxVal} FCFA</span>
      </div>
        <div className="slider-container">
        <div className="slider-track"></div>

        <div
            className="slider-range"
            style={{
            left: `${(minVal / max) * 100}%`,
            right: `${100 - (maxVal / max) * 100}%`,
            }}
        />

        <input
            type="range"
            min={min}
            max={max}
            value={minVal}
            onChange={(e) => {
            const value = Math.min(Number(e.target.value), maxVal - 1);
            setMinVal(value);
            }}
        />

        <input
            type="range"
            min={min}
            max={max}
            value={maxVal}
            onChange={(e) => {
            const value = Math.max(Number(e.target.value), minVal + 1);
            setMaxVal(value);
            }}
        />
        </div>
    </div>
  );
};

export default PriceRangeSlider;