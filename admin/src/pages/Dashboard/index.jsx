// src/pages/Dashboard.jsx
import React from "react";
import DashboardBoxe from "../../components/dashboardboxes";
import OrdersTabPage from "../myaccount/orderstabpage";
import GraphStats from "../../components/graph1/graphstats";
import Product from "../products";
import "./dashboard.scss";

const Dashboard = () => {
  const adminName = "Abdoul-Koudous";

  return (
    <div className="dsh-page">
      {/* ====== SECTION D'EN-TÊTE ====== */}
      <div className="dsh-header">
        <div className="dsh-header-left">
          <h2>
            Bonjour, bienvenue <span>{adminName}</span> 👋
          </h2>
          <p>
            Voici un aperçu de votre activité. Suivez vos ventes, produits et
            performances du mois en un coup d'œil.
          </p>
          <button className="dsh-add-btn">+ Ajouter un produit</button>
        </div>

        <div className="dsh-header-right">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2331/2331966.png"
            alt="Illustration shopping"
          />
        </div>
      </div>

      {/* ====== CARTES STATISTIQUES ====== */}
      <DashboardBoxe />

      {/* ====== TABLE PRODUITS ====== */}
      <Product />

      {/* ====== COMMANDES ====== */}
      <div className="dsh-recent-orders">
        <h2>Commandes récentes</h2>
        <OrdersTabPage />
      </div>

      {/* ====== GRAPH ====== */}
      <GraphStats />
    </div>
  );
};

export default Dashboard;