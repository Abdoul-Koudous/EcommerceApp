import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBoxOpen,
  FaShoppingCart,
  FaUsers,
  FaSignOutAlt,
} from "react-icons/fa";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import "./adminsidebar.scss";

const AdminSidebar = () => {
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const links = [
    { to: "/", label: "Dashboard", icon: <FaTachometerAlt /> },
    {
      label: "Slide Accueil",
      icon: <FaShoppingCart />,
      subLinks: [
        { to: "/slides/lists", label: "Liste des slides" },
        { to: "/slides/add", label: "Ajouter des slides" },
        { to: "/slides/create", label: "Création de slides" },
      ],
    },
    {
      label: "Produits",
      icon: <FaBoxOpen />,
      subLinks: [
        { to: "/products/lists", label: "Liste des produits" },
        { to: "/products/RAM/add", label: "Ajout de RAM" },
        { to: "/products/WEIGHT/add", label: "Ajout de WEIGHT" },
        { to: "/products/SIZE/add", label: "Ajout de SIZE" },
      ],
    },
    {
      label: "Catégories",
      icon: <FaBoxOpen />,
      subLinks: [
        { to: "/categories/lists", label: "Liste des catégories" },
        { to: "/subCategories/lists", label: "Liste des sous catégories" },
      ],
    },
    {
      label: "Commandes",
      icon: <FaShoppingCart />,
      subLinks: [
        { to: "/orders", label: "Toutes les commandes" },
        { to: "/orders/pending", label: "En attente" },
        { to: "/orders/delivered", label: "Livrées" },
      ],
    },
    { to: "/users", label: "Utilisateurs", icon: <FaUsers /> },
  ];

  return (
    <aside className="sidebar">
      {/* === Logo === */}
      <div className="sidebar-logo">
        <h2>
          Yebou<span>Shop</span>
        </h2>
      </div>

      {/* === Liens === */}
      <div className="sidebar-links">
        <ul>
          {links.map((link) => (
            <li key={link.label}>
              {link.subLinks ? (
                <div className="menu-group">
                  {/* Parent clickable */}
                  <div
                    className="menu-parent"
                    onClick={() => toggleMenu(link.label)}
                  >
                    <div className="menu-left">
                      <span className="icon">{link.icon}</span>
                      <span className="label">{link.label}</span>
                    </div>

                    <span className="arrow">
                      {openMenus[link.label] ? (
                        <MdKeyboardArrowUp />
                      ) : (
                        <MdKeyboardArrowDown />
                      )}
                    </span>
                  </div>

                  {/* Sous-menus */}
                  {openMenus[link.label] && (
                    <ul className="submenu">
                      {link.subLinks.map((sub) => (
                        <li key={sub.to}>
                          <NavLink
                            to={sub.to}
                            className={({ isActive }) =>
                              isActive ? "active" : ""
                            }
                          >
                            {sub.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    isActive ? "active menu-link" : "menu-link"
                  }
                >
                  <div className="menu-left">
                    <span className="icon">{link.icon}</span>
                    <span className="label">{link.label}</span>
                  </div>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* === Déconnexion === */}
      <button className="logout-btn">
        <FaSignOutAlt className="icon" /> Déconnexion
      </button>
    </aside>
  );
};

export default AdminSidebar;
