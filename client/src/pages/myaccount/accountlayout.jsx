import React, { useState, useContext, useEffect, useRef } from 'react';
import { NavLink, Outlet } from "react-router-dom";
import {
  FaUser,
  FaBoxOpen,
  FaHeart,
  FaCog,
  FaSignOutAlt,
  FaMapMarkerAlt,
  FaBars,
  FaTimes,
  FaBalanceScale,
  FaComments,
} from "react-icons/fa";
import "./myaccount.scss";
import { UserContext } from "../../UserContext/UserContext";
import { fetchDataFromApi } from "../utils/api";

const AccountLayout = () => {
  const { user } = useContext(UserContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const supportPollRef = useRef(false);

  useEffect(() => {
    if (!user?._id) {
      setUnreadSupportCount(0);
      return undefined;
    }

    let isCurrent = true;
    const refreshUnreadSupportCount = async () => {
      if (document.visibilityState !== "visible" || supportPollRef.current) return;
      supportPollRef.current = true;
      try {
        const response = await fetchDataFromApi(
          "/api/support-conversations/mine",
        );
        if (isCurrent && response?.success && Array.isArray(response.data)) {
          const unreadCount = response.data.reduce(
            (total, conversation) =>
              total + Number(conversation.unreadByCustomer || 0),
            0,
          );
          setUnreadSupportCount(unreadCount);
        }
      } finally {
        supportPollRef.current = false;
      }
    };

    refreshUnreadSupportCount();
    const intervalId = window.setInterval(refreshUnreadSupportCount, 4000);
    return () => {
      isCurrent = false;
      window.clearInterval(intervalId);
    };
  }, [user?._id]);

  const tabs = [
    { id: "profile", label: "Mon Profil", icon: <FaUser /> },
    { id: "orders", label: "Mes Commandes", icon: <FaBoxOpen /> },
    { id: "support", label: "Service client", icon: <FaComments /> },
    { id: "wishlist", label: "Ma Liste", icon: <FaHeart /> },
    { id: "compare", label: "Comparateur", icon: <FaBalanceScale /> },
    { id: "address", label: "Mes Adresses", icon: <FaMapMarkerAlt /> },
    // { id: "settings", label: "Paramètres", icon: <FaCog /> },
    // { id: "logout", label: "Déconnexion", icon: <FaSignOutAlt /> },
  ];

  return (
    <section className="al-layout">
      <aside className="al-sidebar">
        <div className="al-user-row">
          <div className="al-user-info">
            <img
              src={user?.avatar || "/user.jpg"}
              alt="User"
              className="al-avatar"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.src = "/user.jpg";
              }}
            />

            <h3>{user?.name}</h3>
            <p>{user?.email}</p>
          </div>

          {/* Visible uniquement sous 480px, bascule le menu en dropdown */}
          <button
            type="button"
            className="al-menu-toggle"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Fermer le menu du compte" : "Ouvrir le menu du compte"}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <ul className={`al-menu ${menuOpen ? "al-menu-open" : ""}`}>
          {tabs.map((tab) => (
            <li key={tab.id}>
              <NavLink
                to={`/account/${tab.id}`}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `al-menu-link ${isActive ? "al-active" : ""}`
                }
              >
                <span className="al-marker"></span>
                <div className="al-menu-item">
                  <span className="al-icon">{tab.icon}</span>
                  <span className="al-menu-label">{tab.label}</span>
                  {tab.id === "support" && unreadSupportCount > 0 && (
                    <span
                      className="al-unread-badge"
                      aria-label={`${unreadSupportCount} message(s) non lu(s)`}
                    >
                      {unreadSupportCount > 99 ? "99+" : unreadSupportCount}
                    </span>
                  )}
                </div>
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>

      <main className="al-content">
        <Outlet />
      </main>
    </section>
  );
};

export default AccountLayout;