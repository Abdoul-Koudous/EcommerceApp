// src/components/layouts/AdminLayout.jsx
import React from "react";
import AdminSidebar from "../sidebar";
import AdminHeader from "../header";
import "./adminlayout.scss";

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-page">
      {/* Sidebar fixe */}
      <AdminSidebar />

      {/* Header fixe */}
      <AdminHeader />

      {/* Contenu principal */}
      <div className="dashboard">{children}</div>
    </div>
  );
};

export default AdminLayout;
