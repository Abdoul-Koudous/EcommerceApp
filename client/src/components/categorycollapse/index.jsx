import React, { useState } from "react";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { Link } from "react-router-dom";
import "./categorycollapse.scss";

const CategoryCollapse = () => {
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const categories = [
    {
      name: "Électronique",
      sub: [
        {
          name: "Téléphones",
          sub: ["Smartphones", "Accessoires", "Tablettes"],
        },
        {
          name: "Ordinateurs",
          sub: ["PC Portables", "Composants", "Périphériques"],
        },
      ],
    },
    {
      name: "Beauté & Santé",
      sub: [
        { name: "Maquillage", sub: ["Rouges à lèvres", "Poudres", "Parfums"] },
        { name: "Soins du corps", sub: ["Crèmes", "Savons", "Huiles"] },
      ],
    },
    {
      name: "Maison & Cuisine",
      sub: [
        { name: "Ustensiles", sub: ["Casseroles", "Couteaux", "Mixeurs"] },
        { name: "Décoration", sub: ["Lampes", "Cadres", "Rideaux"] },
      ],
    },
  ];

  return (
    <div className="category-filter">
      <h3>Filtrer par Catégorie</h3>
      <ul className="category-list">
        {categories.map((cat, i) => (
          <li key={i}>
            <div className="category-title">
              <Link to={`/categorie/${cat.name}`} className="category-name">
                {cat.name}
              </Link>

              {cat.sub && (
                <span
                  className="toggle-icon"
                  onClick={() => toggleMenu(i)}
                >
                  {openMenus[i] ? <FaMinus /> : <FaPlus />}
                </span>
              )}
            </div>

            {openMenus[i] && cat.sub && (
              <ul className="sub-list">
                {cat.sub.map((sub, j) => (
                  <li key={j}>
                    <div className="subcategory-title">
                      <Link
                        to={`/categorie/${cat.name}/${sub.name}`}
                        className="subcategory-name"
                      >
                        {sub.name}
                      </Link>

                      {sub.sub && (
                        <span
                          className="toggle-icon"
                          onClick={() => toggleMenu(`${i}-${j}`)}
                        >
                          {openMenus[`${i}-${j}`] ? <FaMinus /> : <FaPlus />}
                        </span>
                      )}
                    </div>

                    {openMenus[`${i}-${j}`] && sub.sub && (
                      <ul className="sub-sub-list">
                        {sub.sub.map((item, k) => (
                          <li key={k}>
                            <Link
                              to={`/categorie/${cat.name}/${sub.name}/${item}`}
                            >
                              {item}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryCollapse;
