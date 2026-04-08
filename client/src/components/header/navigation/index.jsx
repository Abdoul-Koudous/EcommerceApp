import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiMenu2Fill } from "react-icons/ri";
import { LiaAngleDownSolid } from "react-icons/lia";
import { GoRocket } from "react-icons/go";
import CategoryPanel from './categoryPanel';
import "./navigation.scss";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <nav>
        <div className="container">
          <div className="cont1">
            <button onClick={toggleDrawer}>
              <RiMenu2Fill /> Toutes les Catégories <LiaAngleDownSolid />
            </button>
          </div>

          <div className="cont2">
            <ul>
              <li><Link to="/" className={isActive('/') ? 'active' : ''}>Accueil</Link></li>
              <li><Link to="/productlisting" className={isActive('/productlisting') ? 'active' : ''}>Boutique</Link></li>
              <li><Link to="/about" className={isActive('/about') ? 'active' : ''}>À propos de nous</Link></li>
              <li><Link to="/contact" className={isActive('/contact') ? 'active' : ''}>Nous contacter</Link></li>
            </ul>
          </div>

          <div className="cont3">
            <p><GoRocket /> Livraison gratuite à l’interne</p>
          </div>
        </div>
      </nav>

      {/* ✅ Drawer des catégories */}
      <CategoryPanel isOpen={isOpen} onClose={toggleDrawer} />
    </>
  );
};

export default Navigation;
