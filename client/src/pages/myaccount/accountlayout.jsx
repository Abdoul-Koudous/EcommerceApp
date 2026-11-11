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
  const [unreadCounts, setUnreadCounts] = useState({
    supportMessages: 0,
    orders: 0,
  });
  const notificationPollRef = useRef(false);

  useEffect(() => {
    if (!user?._id) {
      setUnreadCounts({ supportMessages: 0, orders: 0 });
      return undefined;
    }

    let isCurrent = true;
    const refreshNotifications = async () => {
      if (document.visibilityState !== "visible" || notificationPollRef.current) return;
      notificationPollRef.current = true;
      try {
        const response = await fetchDataFromApi(
          "/api/notifications/mine",
        );
        if (isCurrent && response?.success && response.data) {
          setUnreadCounts(response.data);
        }
      } finally {
        notificationPollRef.current = false;
      }
    };

    refreshNotifications();
    const intervalId = window.setInterval(refreshNotifications, 10000);
    document.addEventListener("visibilitychange", refreshNotifications);
    return () => {
      isCurrent = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshNotifications);
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
                  {tab.id === "support" &&
                    unreadCounts.supportMessages > 0 && (
                    <span
                      className="al-unread-badge"
                      aria-label={`${unreadCounts.supportMessages} réponse(s) non lue(s)`}
                    >
                      {unreadCounts.supportMessages > 99
                        ? "99+"
                        : unreadCounts.supportMessages}
                    </span>
                  )}
                  {tab.id === "orders" && unreadCounts.orders > 0 && (
                    <span
                      className="al-unread-badge"
                      aria-label={`${unreadCounts.orders} mise(s) à jour de commande`}
                    >
                      {unreadCounts.orders > 99 ? "99+" : unreadCounts.orders}
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