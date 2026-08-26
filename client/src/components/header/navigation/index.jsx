import React from "react";
import { Link, useLocation } from "react-router-dom";
import { RiMenu2Fill } from "react-icons/ri";
import { LiaAngleDownSolid } from "react-icons/lia";
import { GoRocket } from "react-icons/go";
import "./navigation.scss";

const Navigation = ({ onOpenDrawer }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="primary-nav">
      <div className="container">
        <div className="cont1">
          <button onClick={onOpenDrawer}>
            <RiMenu2Fill />
            <span className="label">Toutes les Catégories</span>
            <LiaAngleDownSolid />
          </button>
        </div>

        <div className="cont2">
          <ul>
            <li>
              <Link to="/" className={isActive("/") ? "active" : ""}>
                Accueil
              </Link>
            </li>
            <li>
              <Link
                to="/productlisting"
                className={isActive("/productlisting") ? "active" : ""}
              >
                Boutique
              </Link>
            </li>
            <li>
              <Link to="/blog" className={isActive("/blog") ? "active" : ""}>
                Blog
              </Link>
            </li>
            <li>
              <Link to="/about" className={isActive("/about") ? "active" : ""}>
                À propos de nous
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className={isActive("/contact") ? "active" : ""}
              >
                Nous contacter
              </Link>
            </li>
          </ul>
        </div>

        <div className="cont3">
          <p>
            <GoRocket /> Livraison gratuite à l'interne
          </p>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;