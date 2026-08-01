// src/components/layouts/AdminLayout.jsx
import React, { useState } from "react";
import AdminSidebar from "../sidebar";
import AdminHeader from "../header";
import "./adminlayout.scss";

const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false); // drawer mobile (≤1024px) : caché par défaut
  const [collapsed, setCollapsed] = useState(false); // repli desktop (>1024px) : ouvert par défaut

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 1024) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <div className={`admin-page ${collapsed ? "sidebar-collapsed" : ""}`}>
      <AdminSidebar
        isOpen={mobileOpen}
        collapsed={collapsed}
        onClose={() => setMobileOpen(false)}
      />

      <AdminHeader onToggleSidebar={handleToggleSidebar} />

      <div className="dashboard">{children}</div>
    </div>
  );
};

export default AdminLayout;