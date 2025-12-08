import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RiMenu2Fill } from "react-icons/ri";
import { LiaAngleDownSolid } from "react-icons/lia";
import { GoRocket } from "react-icons/go";
import CategoryPanel from './categoryPanel';
import "./navigation.scss";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
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
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/productlisting">Boutique</Link></li>
              <li><Link to="/">À propos de nous</Link></li>
              <li><Link to="/">Nous contacter</Link></li>
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
