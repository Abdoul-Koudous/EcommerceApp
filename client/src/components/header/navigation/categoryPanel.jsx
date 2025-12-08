import React, { useState } from 'react';
import { IoClose } from "react-icons/io5";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { Link } from "react-router-dom"; // ✅ Ajout de Link
import "./categorypanel.scss";

const CategoryPanel = ({ isOpen, onClose }) => {

  const categories = [
    {
      name: "Électronique",
      sub: [
        {
          name: "Téléphones",
          sub: ["Smartphones", "Accessoires", "Tablettes"]
        },
        {
          name: "Ordinateurs",
          sub: ["PC Portables", "Composants", "Périphériques"]
        }
      ]
    },
    {
      name: "Beauté & Santé",
      sub: [
        { name: "Maquillage", sub: ["Rouges à lèvres", "Poudres", "Parfums"] },
        { name: "Soins du corps", sub: ["Crèmes", "Savons", "Huiles"] }
      ]
    },
    {
      name: "Maison & Cuisine",
      sub: [
        { name: "Ustensiles", sub: ["Casseroles", "Couteaux", "Mixeurs"] },
        { name: "Décoration", sub: ["Lampes", "Cadres", "Rideaux"] }
      ]
    }
  ];

  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`drawer-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className={`drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>Catégories</h3>
          <button className="close-btn" onClick={onClose}><IoClose /></button>
        </div>

        <ul className="drawer-list">
          {categories.map((cat, i) => (
            <li key={i}>
              <div className="category-title">
                {/* ✅ Lien vers la catégorie */}
                <Link
                  to={`/categorie/${cat.name}`}
                  className="category-name"
                >
                  {cat.name}
                </Link>

                {/* Bouton + / - */}
                {cat.sub && (
                  <span
                    className="toggle-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(i);
                    }}
                  >
                    {openMenus[i] ? <FaMinus /> : <FaPlus />}
                  </span>
                )}
              </div>

              {/* Sous-catégories */}
              {openMenus[i] && cat.sub && (
                <ul className="sub-list">
                  {cat.sub.map((sub, j) => (
                    <li key={j}>
                      <div className="subcategory-title">
                        {/* ✅ Lien vers la sous-catégorie */}
                        <Link
                          to={`/categorie/${cat.name}/${sub.name}`}
                          className="subcategory-name"
                        >
                          {sub.name}
                        </Link>

                        {sub.sub && (
                          <span
                            className="toggle-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenu(`${i}-${j}`);
                            }}
                          >
                            {openMenus[`${i}-${j}`] ? <FaMinus /> : <FaPlus />}
                          </span>
                        )}
                      </div>

                      {/* Sous-sous-catégories */}
                      {openMenus[`${i}-${j}`] && sub.sub && (
                        <ul className="sub-sub-list">
                          {sub.sub.map((item, k) => (
                            <li key={k}>
                              {/* ✅ Lien final vers l’élément */}
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
    </>
  );
};

export default CategoryPanel;
