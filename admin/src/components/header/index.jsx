import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  RiMenu2Line,
  RiNotification3Line,
  RiSettings3Line,
  RiGlobeLine,
} from "react-icons/ri";
import { IoMdLogOut } from "react-icons/io";
import { FaUserCircle } from "react-icons/fa";
import { UserContext } from "../../UserContext/UserContext";
import { fetchDataFromApi } from "../../pages/utils/api";
import "./adminheader.scss";
import { ToastContext } from "../../context/ToastContext";
import { Link } from "react-router-dom";

const AdminHeader = ({ onToggleSidebar }) => {
  const { user, loadUser } = useContext(UserContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const notifications = 4;
  const navigate = useNavigate();
  const { openToast } = useContext(ToastContext);


  // fermer le menu si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = async () => {
    try {
      const res = await fetchDataFromApi("/api/users/logout");

      if (res.success) {
        openToast("success", res.message); // ✅ message backend visible

        localStorage.removeItem("accesstoken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userEmail");

        loadUser(); 
        navigate("/login");
      } else {
        openToast("error", res.message || "Erreur lors de la déconnexion");
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      openToast("error", "Impossible de se déconnecter");
    }
  };



  return (
    <header className="admin-header">
      <div className="part1">
        <button className="menu-btn" onClick={onToggleSidebar}>
          <RiMenu2Line />
        </button>
      </div>

      <div className="part2">
        {user ? (
          <>
            <div className="icon-wrapper badge">
              <RiNotification3Line className="icon" />
              <span className="badge-number">
                {notifications > 9 ? "9+" : notifications}
              </span>
            </div>

            <div className="icon-wrapper">
              <RiSettings3Line className="icon" />
            </div>

            <div className="icon-wrapper">
              <RiGlobeLine className="icon" />
            </div>

            <div className="user-menu" ref={menuRef}>
              <div
                className="user-profile"
                onClick={() => setIsMenuOpen((prev) => !prev)}
              >
                <img
                  src={user.avatar || "/user.jpg"}
                  alt="User"
                  className="avatar"
                />
              </div>

              {isMenuOpen && (
                <div className="dropdown-menu">
                  <div className="profile-header">
                    <img
                      src={user.avatar || "/user.jpg"}
                      alt="User"
                      className="avatar"
                    />
                    <div className="info">
                      <h4>{user.name}</h4>
                      <p>{user.email}</p>
                    </div>
                  </div>

                   <ul className="menu-items">
                      <li>
                        <Link to="/profile">
                          <FaUserCircle className="icon" /> Mon compte
                        </Link>
                      </li>
                      <li>
                        <Link to="/settings">
                          <RiSettings3Line className="icon" /> Paramètres
                        </Link>
                      </li>
                      <li className="logout" onClick={() => logout(navigate)}>
                        <IoMdLogOut className="icon" /> Déconnexion
                      </li>
                    </ul>
                </div>
              )}
            </div>
          </>
        ) : (
          <button className="login-btn" onClick={() => navigate("/login")}>
            Se connecter
          </button>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
