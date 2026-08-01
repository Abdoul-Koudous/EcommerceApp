import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Search from "../search";
import Navigation from "./navigation";
import CartPanel from "../cartpanel";
import {
  FaHeart,
  FaShoppingCart,
  FaBalanceScale,
  FaUser,
  FaBoxOpen,
  FaSignOutAlt,
} from "react-icons/fa";
import { fetchDataFromApi } from "../../pages/utils/api";
import "./header.scss";
import { UserContext } from "../../UserContext/UserContext";
import { ToastContext } from "../../context/ToastContext";
import ThemeToggle from "../themetoggle";

const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const [catData, setCatData] = useState([]);
  const { user, cartItems, categories, myListItems } = useContext(UserContext);

  const { openToast } = useContext(ToastContext);

  const isLoggedIn = !!user?._id;

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleCart = () => setCartOpen(!cartOpen);

  const logout = async () => {
    try {
      // Appel backend pour supprimer cookies
      await fetchDataFromApi("/api/users/logout", { method: "POST" });

      // Nettoyage localStorage
      localStorage.removeItem("accesstoken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userEmail");
      setCatData(categories);

      // Redirection vers accueil
      navigate("/");
      window.location.reload(); // pour rafraîchir le header
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  useEffect(() => {
    console.log("PANIER CONTEXT:", cartItems);
  }, [cartItems]);

  return (
    <header>
      <div className="top-strip">
        <div className="container">
          <div className="cont1">
            <p>Obtenez 25% de réduction sur vos achats cette semaine !!!</p>
          </div>
          <div className="cont2">
            <ul>
              <li>
                <Link to="track-order" className="lien">
                  Suivre la commande
                </Link>
              </li>
              <li>
                <Link to="help-center" className="lien">
                  Centre d'aide
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="header">
        <div className="container">
          <div className="cont1">
            <Link to={"/"}>
              <img src="/logo.png" alt="logo" />
            </Link>
          </div>

          <div className="cont2">
            <Search />
          </div>

          <div className="cont3">
            <ul>
              <li className="theme-toggle-item">
                <ThemeToggle />
              </li>
              {!isLoggedIn ? (
                <div>
                  <Link className="lien2" to="/login">
                    Connexion
                  </Link>{" "}
                  |{" "}
                  <Link className="lien2" to="/register">
                    Enregistrement
                  </Link>
                </div>
              ) : (
                <li className="user-menu">
                  <div
                    className="user-info"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <img
                      src={user?.avatar || "/user.jpg"}
                      alt="User"
                      className="user-avatar"
                    />

                    <div className="user-details">
                      <span className="user-name">{user?.name}</span>
                      <span className="user-email">{user?.email}</span>
                    </div>
                  </div>

                  {dropdownOpen && (
                    <ul className="dropdown-menu">
                      <li>
                        <FaUser className="icon" />
                        <Link to="/account/profile">Mon compte</Link>
                      </li>
                      <li>
                        <FaBoxOpen className="icon" />
                        <Link to="/account/orders">Mes commandes</Link>
                      </li>
                      <li>
                        <FaHeart className="icon" />
                        <Link to="/account/wishlist">Ma liste</Link>
                      </li>
                      <li onClick={logout}>
                        <FaSignOutAlt className="icon" />
                        <span style={{ cursor: "pointer" }}>Déconnexion</span>
                      </li>
                    </ul>
                  )}
                </li>
              )}

              <li
                className="iconBox"
                onClick={() => navigate("/account/wishlist")}
              >
                <FaHeart className="icon" />
                <span className="count">{myListItems.length}</span>
                <span className="tooltip">Souhaits</span>
              </li>
              <li className="iconBox">
                <FaBalanceScale className="icon" />
                <span className="count">2</span>
                <span className="tooltip">Comparer</span>
              </li>
              <li className="iconBox" onClick={toggleCart}>
                <FaShoppingCart className="icon" />
                <span className="count">{cartItems.length}</span>
                <span className="tooltip">Panier</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Navigation />
      <CartPanel isOpen={cartOpen} onClose={toggleCart} openToast={openToast} />
    </header>
  );
};

export default Header;
