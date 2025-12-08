import React, { useState,useContext } from 'react'; 
import { NavLink, Outlet } from "react-router-dom";
import {
  FaUser,
  FaBoxOpen,
  FaHeart,
  FaCog,
  FaSignOutAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";
import "./myaccount.scss";
import { UserContext } from "../../UserContext/UserContext";

const AccountLayout = () => {
  const { user } = useContext(UserContext);
  

  const tabs = [
    { id: "profile", label: "Mon Profil", icon: <FaUser /> },
    { id: "orders", label: "Mes Commandes", icon: <FaBoxOpen /> },
    { id: "wishlist", label: "Ma Liste", icon: <FaHeart /> },
    { id: "address", label: "Mes Adresses", icon: <FaMapMarkerAlt /> },
    { id: "settings", label: "Paramètres", icon: <FaCog /> },
    { id: "logout", label: "Déconnexion", icon: <FaSignOutAlt /> },
  ];

  return (
    <section className="account-layout">
      <aside className="sidebar">
        <div className="user-info">
          <img
            src={user?.avatar || "/user.jpg"}
            alt="User"
            className="avatar"
          />

          <h3>{user?.name}</h3>
          <p>{user?.email}</p>
        </div>

        <ul className="menu">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <NavLink
                to={`/account/${tab.id}`}
                className={({ isActive }) =>
                  `menu-link ${isActive ? "active" : ""}`
                }
              >
                <span className="marker"></span>
                <div className="menu-item">
                  <span className="icon">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </section>
  );
};

export default AccountLayout;
