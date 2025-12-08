// layouts/MainLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";

const MainLayout = () => {
  return (
    <>
      <Header/>
      <Outlet />
      <Footer/>
    </>
  );
};

export default MainLayout;
