import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminHeader from "../components/admin/header";
import AdminSidebar from "../components/admin/sidebar";
import "./adminlayout.scss";

const AdminLayout = () => {
  // 🔹 État qui contrôle la sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <section className={`admin-layout ${isSidebarCollapsed ? "collapsed" : ""}`}>
      {/* Header reçoit une fonction pour toggler */}
      <AdminHeader onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)} />

      <div className="admin-body">
        <AdminSidebar collapsed={isSidebarCollapsed} />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </section>
  );
};

export default AdminLayout;
