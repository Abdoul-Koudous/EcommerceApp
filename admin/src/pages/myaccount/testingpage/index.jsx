import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  FaUser,
  FaBoxOpen,
  FaHeart,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import "./myaccount.scss";
import "./profiletab.scss";
import WishlistTabPage from "../../wishlisttab";
import OrdersTabPage from "../orderstabpage";


const MyAccount = () => {
   // 🔒 PROTECTION D’ACCÈS
  const token = localStorage.getItem("accesstoken");
  if (!token) return <Navigate to="/login" replace />;
  const [activeTab, setActiveTab] = useState("profil");
  const [editMode, setEditMode] = useState(false);


  const user = {
    name: "John Doe",
    email: "john@example.com",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCzK6DKnIE7MM_7cuaQAJlpxUHYs8yKDT3yg&s",
  };

  const tabs = [
    { id: "profil", label: "Mon Profil", icon: <FaUser /> },
    { id: "orders", label: "Mes Commandes", icon: <FaBoxOpen /> },
    { id: "wishlist", label: "Ma Liste", icon: <FaHeart /> },
    { id: "settings", label: "Paramètres", icon: <FaCog /> },
    { id: "logout", label: "Déconnexion", icon: <FaSignOutAlt /> },
  ];

  // === CONTENU DYNAMIQUE SELON ONGLET ===
  const renderContent = () => {
    switch (activeTab) {
      case "profil":
        return (
            <div className="tab-content profile-tab">
            <h2>Mon Profil</h2>

            <div className="profile-header">
                <div className="profile-avatar">
                <img src={user.avatar} alt="User avatar" />
                <label htmlFor="avatar-upload" className="change-avatar">
                    Changer
                </label>
                <input id="avatar-upload" type="file" accept="image/*" hidden />
                </div>
            </div>

            <form className="profile-form">
                <div className="form-group">
                <label>Nom complet</label>
                <input type="text" defaultValue={user.name} disabled={!editMode} />
                </div>

                <div className="form-group">
                <label>Email</label>
                <input type="email" defaultValue={user.email} disabled={!editMode} />
                </div>

                <div className="form-group">
                <label>Mot de passe</label>
                <input
                    type="password"
                    placeholder="••••••••"
                    disabled={!editMode}
                />
                </div>

                <div className="actions">
                {!editMode ? (
                    <button
                    type="button"
                    className="btn-edit"
                    onClick={() => setEditMode(true)}
                    >
                    Modifier le profil
                    </button>
                ) : (
                    <div className="edit-buttons">
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setEditMode(false)}
                    >
                        Annuler
                    </button>
                    <button type="submit" className="btn-save">
                        Enregistrer
                    </button>
                    </div>
                )}
                </div>
            </form>
            </div>
        );

      case "orders":
        return (
          <div className="tab-content">
            <h2>Mes Commandes</h2>
            <OrdersTabPage/>
          </div>
        );
      case "wishlist":
        return (
          <div className="tab-content">
            <h2>Ma Liste de souhaits</h2>
            <WishlistTabPage/>
          </div>
        );
      case "settings":
        return (
          <div className="tab-content">
            <h2>Paramètres</h2>
            <p>Gérez vos informations de compte et vos préférences.</p>
          </div>
        );
      case "logout":
        return (
          <div className="tab-content">
            <h2>Déconnexion</h2>
            <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="account-layout">
      {/* === SIDEBAR === */}
      <aside className="sidebar">
        <div className="user-info">
          <img src={user.avatar} alt="User" className="avatar" />
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>

        <ul className="menu">
          {tabs.map((tab) => (
            <li
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="marker"></span>
              <div className="menu-item">
                <span className="icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* === CONTENU === */}
      <main className="content">{renderContent()}</main>
    </section>
  );
};

export default MyAccount;
