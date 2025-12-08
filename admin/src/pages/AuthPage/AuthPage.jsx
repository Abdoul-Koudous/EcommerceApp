import React, { useState, useEffect } from "react";
import { FaSignInAlt, FaUserPlus } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import "./authpage.scss";
import LoginForm from "../login";
import RegisterForm from "../register";
import OTPPage from "../OTPPage/OTPPage";
import ResetPassword from "../ResetPassword/ResetPassword";

const AuthPage = ({ defaultForm = "login" }) => {
  const location = useLocation();
  const [activeForm, setActiveForm] = useState(defaultForm);

  useEffect(() => {
    // Met à jour le formulaire actif si la route change
    if (location.pathname === "/login") setActiveForm("login");
    else if (location.pathname === "/register") setActiveForm("register");
    else if (location.pathname === "/otp") setActiveForm("otp");
    else if (location.pathname === "/reset-password") setActiveForm("reset");
  }, [location.pathname]);

  return (
    <div className="auth-page">
      <header className="auth-header">
        <div className="logo">🛒 YebouShop</div>
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
        {activeForm === "login" && <LoginForm />}
        {activeForm === "register" && <RegisterForm />}
        {activeForm === "otp" && <OTPPage />}
        {activeForm === "reset" && <ResetPassword/>}
      </div>
    </div>
  );
};

export default AuthPage;
