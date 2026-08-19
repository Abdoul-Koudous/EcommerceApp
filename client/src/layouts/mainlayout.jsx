// layouts/MainLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";

const MainLayout = () => {
  return (
    <div className="app-shell">
      <Header/>
      <Outlet />
      <Footer/>
    </div>
  );
};

export default MainLayout;