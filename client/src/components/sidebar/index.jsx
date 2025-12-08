import React, { useState } from "react";
import "./sidebar.scss";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";

const categories = [
  { name: "Électronique", count: 24 },
  { name: "Mode Homme", count: 12 },
  { name: "Mode Femme", count: 18 },
  { name: "Accessoires", count: 9 },
  { name: "Montres", count: 5 },
];

const disponibilites = [
  { name: "En stock", count: 40 },
  { name: "Rupture de stock", count: 7 },
  { name: "Bientôt disponible", count: 3 },
];

const tailles = [
  { name: "S", count: 12 },
  { name: "M", count: 20 },
  { name: "L", count: 15 },
  { name: "XL", count: 8 },
  { name: "XXL", count: 4 },
];
const ratings = [
  { stars: 5, count: 12 },
  { stars: 4, count: 8 },
  { stars: 3, count: 6 },
  { stars: 2, count: 3 },
  { stars: 1, count: 1 },
];


const SideBar = () => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isDisponibilityOpen, setIsDisponibilityOpen] = useState(true);
  const [isSizeOpen, setIsSizeOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);

  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [isRatingOpen, setIsRatingOpen] = useState(true);


  const handleMinChange = (e) => {
    const value = Number(e.target.value);
    setPriceRange((prev) => ({
      ...prev,
      min: value > prev.max ? prev.max : value,
    }));
  };

  const handleMaxChange = (e) => {
    const value = Number(e.target.value);
    setPriceRange((prev) => ({
      ...prev,
      max: value < prev.min ? prev.min : value,
    }));
  };

  return (
    <section className="sidebar-section">
      {/* === Bloc Catégories === */}
      <div className="box">
        <h3 onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
          Catégorie{" "}
          <span className="toggle-icon">
            {isCategoryOpen ? <FaAngleUp /> : <FaAngleDown />}
          </span>
        </h3>
        <div className={`checkbox-list ${isCategoryOpen ? "open" : "closed"}`}>
          {categories.map((cat, index) => (
            <label key={index} className="checkbox-item">
              <input type="checkbox" />
              <span className="label-text">{cat.name}</span>
              <span className="label-count">{cat.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* === Bloc Disponibilité === */}
      <div className="box">
        <h3 onClick={() => setIsDisponibilityOpen(!isDisponibilityOpen)}>
          Disponibilité{" "}
          <span className="toggle-icon">
            {isDisponibilityOpen ? <FaAngleUp /> : <FaAngleDown />}
          </span>
        </h3>
        <div
          className={`checkbox-list ${
            isDisponibilityOpen ? "open" : "closed"
          }`}
        >
          {disponibilites.map((item, index) => (
            <label key={index} className="checkbox-item">
              <input type="checkbox" />
              <span className="label-text">{item.name}</span>
              <span className="label-count">{item.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* === Bloc Taille === */}
      <div className="box">
        <h3 onClick={() => setIsSizeOpen(!isSizeOpen)}>
          Taille{" "}
          <span className="toggle-icon">
            {isSizeOpen ? <FaAngleUp /> : <FaAngleDown />}
          </span>
        </h3>
        <div className={`checkbox-list ${isSizeOpen ? "open" : "closed"}`}>
          {tailles.map((item, index) => (
            <label key={index} className="checkbox-item">
              <input type="checkbox" />
              <span className="label-text">{item.name}</span>
              <span className="label-count">{item.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* === Bloc Prix === */}
      <div className="box">
        <h3 onClick={() => setIsPriceOpen(!isPriceOpen)}>
          Prix{" "}
          <span className="toggle-icon">
            {isPriceOpen ? <FaAngleUp /> : <FaAngleDown />}
          </span>
        </h3>
        <div className={`checkbox-list ${isPriceOpen ? "open" : "closed"}`}>
          <div className="price-range">
            <div className="price-values">
              <span>{priceRange.min} €</span>
              <span>{priceRange.max} €</span>
            </div>
            <div className="range-inputs">
              <div className="range-track"></div>
              <div
                className="range-fill"
                style={{
                  left: `${(priceRange.min / 1000) * 100}%`,
                  width: `${((priceRange.max - priceRange.min) / 1000) * 100}%`,
                }}
              ></div>

              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange.min}
                onChange={handleMinChange}
              />
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange.max}
                onChange={handleMaxChange}
              />
            </div>
          </div>
        </div>
      </div>
      {/* === Bloc Rating === */}
        <div className="box">
        <h3 onClick={() => setIsRatingOpen(!isRatingOpen)}>
            Note{" "}
            <span className="toggle-icon">
            {isRatingOpen ? <FaAngleUp /> : <FaAngleDown />}
            </span>
        </h3>
        <div className={`checkbox-list ${isRatingOpen ? "open" : "closed"}`}>
            {ratings.map((rating, index) => (
            <label key={index} className="checkbox-item">
                <input type="checkbox" />
                <span className="label-text">
                {/* Affichage des étoiles */}
                {Array.from({ length: rating.stars }).map((_, i) => (
                    <span key={i} style={{ color: "#e63946" }}>★</span>
                ))}
                </span>
                <span className="label-count">{rating.count}</span>
            </label>
            ))}
        </div>
        </div>


    </section>
  );
};

export default SideBar;
