import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiMenu2Fill } from "react-icons/ri";
import { LiaAngleDownSolid } from "react-icons/lia";
import { GoRocket } from "react-icons/go";
import { IoMenuOutline, IoClose } from "react-icons/io5";
import CategoryPanel from './categoryPanel';
import "./navigation.scss";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeDrawer = () => setIsOpen(false);
  const toggleDrawer = () => setIsOpen(!isOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav>
        <div className="container">
          <div className="cont1">
            <button onClick={toggleDrawer}>
              <RiMenu2Fill /> <span className="label">Toutes les Catégories</span> <LiaAngleDownSolid />
            </button>
          </div>

          <button
            className="mobile-toggle"
            onClick={toggleMobileMenu}
            aria-label="Ouvrir le menu de navigation"
          >
            {mobileMenuOpen ? <IoClose /> : <IoMenuOutline />}
          </button>

          <div className={`cont2 ${mobileMenuOpen ? "open" : ""}`}>
            <ul>
              <li><Link to="/" className={isActive('/') ? 'active' : ''} onClick={closeMobileMenu}>Accueil</Link></li>
              <li><Link to="/productlisting" className={isActive('/productlisting') ? 'active' : ''} onClick={closeMobileMenu}>Boutique</Link></li>
              <li><Link to="/about" className={isActive('/about') ? 'active' : ''} onClick={closeMobileMenu}>À propos de nous</Link></li>
              <li><Link to="/contact" className={isActive('/contact') ? 'active' : ''} onClick={closeMobileMenu}>Nous contacter</Link></li>
            </ul>
          </div>

          <div className="cont3">
            <p><GoRocket /> Livraison gratuite à l'interne</p>
          </div>
        </div>
      </nav>

      <CategoryPanel isOpen={isOpen} onClose={closeDrawer} />
    </>
  );
};

export default Navigation;