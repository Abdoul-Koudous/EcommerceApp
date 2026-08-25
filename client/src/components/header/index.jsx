import React, { useState, useContext, useEffect, useRef } from "react";
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
import { ThemeContext } from "../../context/ThemeContext";

const Header = () => {
  const [cartOpen, setCartOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showTopStrip, setShowTopStrip] = useState(true);
  const navigate = useNavigate();
  const stickyRef = useRef(null);

  const { theme } = useContext(ThemeContext);
  // dans la déstructuration du contexte, ajoute compareItems
const { user, setUser, cartItems, categories, myListItems, compareItems } =
  useContext(UserContext);
  const { openToast } = useContext(ToastContext);

  const isLoggedIn = !!user?._id;

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const toggleCart = () => setCartOpen(!cartOpen);

  const logout = async () => {
    try {
      await fetchDataFromApi("/api/users/logout");
      localStorage.removeItem("accesstoken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userEmail");
      setUser(null);
      setDropdownOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      openToast("error", "Erreur lors de la déconnexion");
    }
  };

  useEffect(() => {
    console.log("PANIER CONTEXT:", cartItems);
  }, [cartItems]);

  // ✅ Masque le top-strip après un petit scroll (réapparaît si on remonte tout en haut)
  useEffect(() => {
    const handleScroll = () => {
      setShowTopStrip(window.scrollY < 60);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Mesure la hauteur réelle du bloc fixed et pousse le contenu en dessous
  useEffect(() => {
    const updateHeight = () => {
      if (stickyRef.current) {
        const height = stickyRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--header-height",
          `${height}px`,
        );
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    const resizeObserver = new ResizeObserver(updateHeight);
    if (stickyRef.current) resizeObserver.observe(stickyRef.current);

    return () => {
      window.removeEventListener("resize", updateHeight);
      resizeObserver.disconnect();
    };
  }, [showTopStrip]);

  return (
    <header className="site-header">
      <div className="site-header__sticky-wrap" ref={stickyRef}>
        {showTopStrip && (
          <div className="site-header__top-strip">
            <div className="site-header__top-container">
              <div className="site-header__top-left">
                <p>Obtenez 25% de réduction sur vos achats cette semaine !!!</p>
              </div>
              <div className="site-header__top-right">
                <ul>
                  <li>
                    <Link to="/track-order" className="site-header__top-link">
                      Suivre la commande
                    </Link>
                  </li>
                  <li>
                    <Link to="/help-center" className="site-header__top-link">
                      Centre d'aide
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="site-header__main">
          <div className="site-header__main-container">
            <div className="site-header__logo">
              <Link to={"/"}>
                {theme === "dark" ? (
                  <img src="/logo-dark.png" alt="logo dark" />
                ) : (
                  <img src="/logo-light.png" alt="logo light" />
                )}
              </Link>
            </div>

            <div className="site-header__search">
              <Search />
            </div>

            <div className="site-header__actions">
              <ul>
                <li className="site-header__theme-toggle">
                  <ThemeToggle />
                </li>
                {!isLoggedIn ? (
                  <div>
                    <Link className="site-header__auth-link" to="/login">
                      Connexion
                    </Link>{" "}
                    |{" "}
                    <Link className="site-header__auth-link" to="/register">
                      Enregistrement
                    </Link>
                  </div>
                ) : (
                  <li className="site-header__user-menu">
                    <div
                      className="site-header__user-info"
                      onClick={toggleDropdown}
                    >
                      <img
                        src={user?.avatar || "/user.jpg"}
                        alt="User"
                        className="site-header__user-avatar"
                      />
                      <div className="site-header__user-details">
                        <span className="site-header__user-name">
                          {user?.name}
                        </span>
                        <span className="site-header__user-email">
                          {user?.email}
                        </span>
                      </div>
                    </div>

                    {dropdownOpen && (
                      <ul className="site-header__dropdown-menu">
                        <li>
                          <FaUser className="site-header__dropdown-icon" />
                          <Link to="/account/profile">Mon compte</Link>
                        </li>
                        <li>
                          <FaBoxOpen className="site-header__dropdown-icon" />
                          <Link to="/account/orders">Mes commandes</Link>
                        </li>
                        <li>
                          <FaHeart className="site-header__dropdown-icon" />
                          <Link to="/account/wishlist">Ma liste</Link>
                        </li>
                        <li onClick={logout}>
                          <FaSignOutAlt className="site-header__dropdown-icon" />
                          <span style={{ cursor: "pointer" }}>Déconnexion</span>
                        </li>
                      </ul>
                    )}
                  </li>
                )}

                <li
                  className="site-header__icon-box"
                  onClick={() => navigate("/account/wishlist")}
                >
                  <FaHeart className="site-header__icon" />
                  <span className="site-header__badge">
                    {myListItems.length}
                  </span>
                  <span className="site-header__tooltip">Souhaits</span>
                </li>
               
<li
  className="site-header__icon-box"
  onClick={() => navigate("/account/compare")}
>
  <FaBalanceScale className="site-header__icon" />
  <span className="site-header__badge">{compareItems.length}</span>
  <span className="site-header__tooltip">Comparer</span>
</li>
                <li className="site-header__icon-box" onClick={toggleCart}>
                  <FaShoppingCart className="site-header__icon" />
                  <span className="site-header__badge">{cartItems.length}</span>
                  <span className="site-header__tooltip">Panier</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Navigation />
      </div>

      {/* Espace réservé pour compenser le header fixed */}
      <div className="site-header__spacer" />

      <CartPanel isOpen={cartOpen} onClose={toggleCart} openToast={openToast} />
    </header>
  );
};

export default Header;
