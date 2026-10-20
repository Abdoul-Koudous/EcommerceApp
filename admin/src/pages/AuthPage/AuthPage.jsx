import React, { useState, useEffect } from "react";
import { FaSignInAlt, FaUserPlus } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import "./authpage.scss";
import LoginForm from "../login";
import RegisterForm from "../register";
import OTPPage from "../OTPPage/OTPPage";
import ResetPassword from "../ResetPassword/ResetPassword";
import { fetchDataFromApi } from "../utils/api";

const AuthPage = ({ defaultForm = "login" }) => {
  const location = useLocation();
  const activeForm =
    {
      "/login": "login",
      "/register": "register",
      "/otp": "otp",
      "/reset-password": "reset",
    }[location.pathname] || defaultForm;
  const [storeName, setStoreName] = useState("YebouShop");

  useEffect(() => {
    let cancelled = false;
    fetchDataFromApi("/api/settings").then((response) => {
      if (cancelled) return;
      if (response?.error) {
        console.error(
          "Impossible de charger le nom de la boutique:",
          response.message,
        );
        return;
      }
      setStoreName(response?.settings?.storeIdentity?.name || "YebouShop");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="auth-page">
      <header className="auth-header">
        <div className="logo">🛒 {storeName}</div>
        <div className="auth-buttons">
          <Link to="/login" className={activeForm === "login" ? "active" : ""}>
            <FaSignInAlt /> Login
          </Link>
          <Link
            to="/register"
            className={activeForm === "register" ? "active" : ""}
          >
            <FaUserPlus /> Sign Up
          </Link>
        </div>
      </header>

      <div className="auth-form-wrapper">
        {activeForm === "login" && <LoginForm storeName={storeName} />}
        {activeForm === "register" && <RegisterForm storeName={storeName} />}
        {activeForm === "otp" && <OTPPage />}
        {activeForm === "reset" && <ResetPassword storeName={storeName} />}
      </div>
    </div>
  );
};

export default AuthPage;
