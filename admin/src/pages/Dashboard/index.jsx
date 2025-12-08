// src/pages/Dashboard.jsx
import React from "react";
import DashboardBoxe from "../../components/dashboardboxes";
import OrdersTabPage from "../myaccount/orderstabpage";
import ProductTable from "../../components/producrttable1/producttable";
import GraphStats from "../../components/graph1/graphstats";

const Dashboard = () => {
  const adminName = "Abdoul-Koudous";

  return (
    <>
      {/* ====== SECTION D’EN-TÊTE ====== */}
      <div className="dashboard-header">
        <div className="left">
          <h2>
            Bonjour, bienvenue <span>{adminName}</span> 👋
          </h2>
          <p>
            Voici un aperçu de votre activité. Suivez vos ventes, produits et
            performances du mois en un coup d’œil.
          </p>
          <button className="add-btn">+ Ajouter un produit</button>
        </div>

        <div className="right">
          <img
            src="https://cdn-icons-png.flaticon.com/512/2331/2331966.png"
            alt="Illustration shopping"
          />
        </div>
      </div>

      {/* ====== CARTES STATISTIQUES ====== */}
      <DashboardBoxe />

      {/* ====== TABLE PRODUITS ====== */}
      <ProductTable />

      {/* ====== COMMANDES ====== */}
      <div className="recentOrder">
        <h2>Commandes récentes</h2>
        <OrdersTabPage />
      </div>

      {/* ====== GRAPH ====== */}
      <GraphStats />
    </>
  );
};

export default Dashboard;
