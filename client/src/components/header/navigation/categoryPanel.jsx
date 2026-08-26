import React, { useContext, useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { FaHeart, FaBalanceScale, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import { fetchDataFromApi } from "../../../pages/utils/api";
import { UserContext } from "../../../UserContext/UserContext";

const NAV_LINKS = [
  { to: "/", label: "Accueil" },
  { to: "/productlisting", label: "Boutique" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "À propos de nous" },
  { to: "/contact", label: "Nous contacter" },
];

const CategoryPanel = ({ isOpen, onClose }) => {
  const [openMenus, setOpenMenus] = useState({});
  const [catData, setCatData] = useState([]);
  const { user, myListItems, compareItems } = useContext(UserContext);
  const isLoggedIn = !!user?._id;

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Charge les catégories seulement à l'ouverture du drawer (évite un fetch inutile au montage)
  useEffect(() => {
    if (!isOpen) return;
    fetchDataFromApi("/api/category")
      .then((res) => {
        if (res.error === false) {
          setCatData(res?.data);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`drawer-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
      ></div>

      {/* Drawer unique : accueil + nav + compte + catégories */}
      <div className={`drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>Menu</h3>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <IoClose />
          </button>
        </div>

        {/* Bandeau d'accueil personnalisé */}
        <div className="drawer-welcome">
          <div className="drawer-welcome-avatar">
            {isLoggedIn ? (
              <img src={user?.avatar || "/user.jpg"} alt={user?.name} />
            ) : (
              <FaUser />
            )}
          </div>
          <div className="drawer-welcome-text">
            <strong>
              {isLoggedIn
                ? `Bonjour, ${user?.name?.split(" ")[0]}`
                : "Bienvenue"}
            </strong>
            {!isLoggedIn && (
              <div className="drawer-auth-links">
                <Link to="/login" onClick={onClose}>
                  Se connecter
                </Link>
                <span className="separator"> / </span>
                <Link to="/register" onClick={onClose}>
                  S'enregistrer
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Barre "charge" signature */}
        <div className="drawer-charge-bar" aria-hidden="true" />

        {/* Liens de navigation principaux */}
        <nav className="drawer-nav-links">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} onClick={onClose}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Compte / wishlist / comparateur */}
        <ul className="drawer-account-links">
          {isLoggedIn && (
            <li>
              <Link to="/account/profile" onClick={onClose}>
                <FaUser className="drawer-account-icon" />
                Mon compte
              </Link>
            </li>
          )}
          <li>
            <Link to="/account/wishlist" onClick={onClose}>
              <FaHeart className="drawer-account-icon" />
              Ma liste
              {myListItems?.length > 0 && (
                <span className="drawer-account-badge">
                  {myListItems.length}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/account/compare" onClick={onClose}>
              <FaBalanceScale className="drawer-account-icon" />
              Comparer
              {compareItems?.length > 0 && (
                <span className="drawer-account-badge">
                  {compareItems.length}
                </span>
              )}
            </Link>
          </li>
        </ul>

        <div className="drawer-section-title">Catégories</div>

        <ul className="drawer-list">
          {catData?.length !== 0 &&
            catData.map((cat, i) => (
              <li key={i}>
                <div className="category-title">
                  <Link
                    to={`/productlisting?catId=${cat?._id}`}
                    className="category-name"
                    onClick={onClose}
                  >
                    {cat?.name}
                  </Link>

                  {cat?.children && cat.children.length > 0 && (
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

                {openMenus[i] && cat?.children?.length !== 0 && (
                  <ul className="sub-list">
                    {cat.children.map((sub, j) => (
                      <li key={j}>
                        <div className="subcategory-title">
                          <Link
                            to={`/productlisting?subCatId=${sub?._id}`}
                            className="subcategory-name"
                            onClick={onClose}
                          >
                            {sub?.name}
                          </Link>

                          {sub?.children && sub.children.length > 0 && (
                            <span
                              className="toggle-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMenu(`${i}-${j}`);
                              }}
                            >
                              {openMenus[`${i}-${j}`] ? (
                                <FaMinus />
                              ) : (
                                <FaPlus />
                              )}
                            </span>
                          )}
                        </div>

                        {openMenus[`${i}-${j}`] &&
                          sub.children?.length !== 0 && (
                            <ul className="sub-sub-list">
                              {sub.children.map((item, k) => (
                                <li key={k}>
                                  <Link
                                    to={`/productlisting?thirdsubCatId=${item?._id}`}
                                    onClick={onClose}
                                  >
                                    {item?.name || item}
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
