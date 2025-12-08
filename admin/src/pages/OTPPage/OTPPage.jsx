// src/pages/AuthPage/OTPPage.jsx
import React, { useState, useContext } from "react";
import { FaCheckCircle } from "react-icons/fa";
import "./OTPPage.scss";
import { postData } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { useNavigate } from "react-router";

const OTPPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const { openToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const email = localStorage.getItem("userEmail");
  const actionType = localStorage.getItem("actionType");

  // 📌 Gestion des inputs OTP
  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < otp.length - 1) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  // 📌 Soumission OTP
  const handleSubmit = (e) => {
    e.preventDefault();
    const code = otp.join("");
    setLoading(true);

    if (actionType === "forgot-password") {
      postData("/api/users/verify-forgot-password-otp", { email, otp: code })
        .then((res) => {
          if (!res.error) {
            openToast("success", res.message);
            setTimeout(() => navigate("/reset-password"), 800);
          } else {
            openToast("error", res.message);
          }
        })
        .finally(() => setLoading(false));
      return;
    }

    // Vérification normale (inscription)
    postData("/api/users/verifyEmail", { email, otp: code })
      .then((res) => {
        if (!res.error) {
          openToast("success", res.message);
          localStorage.removeItem("userEmail");
          localStorage.removeItem("actionType");
          setTimeout(() => navigate("/login"), 800);
        } else {
          openToast("error", res.message);
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="otp-page">
      <div className="otp-icon">
        <FaCheckCircle />
      </div>

      <h2>Bienvenue sur la vérification</h2>
      <p>
        Un code OTP a été envoyé à <strong>{email}</strong>
      </p>

      <form className="otp-form" onSubmit={handleSubmit}>
        <div className="otp-inputs">
          {otp.map((value, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              maxLength="1"
              value={value}
              onChange={(e) => handleChange(e.target.value, i)}
              disabled={loading}
            />
          ))}
        </div>

        <button type="submit" className="verify-btn" disabled={loading}>
          {loading ? <CircularProgress /> : "Vérifier"}
        </button>
      </form>

      <p className="resend-text">
        Pas reçu ? <a href="#">Renvoyer le code</a>
      </p>
    </div>
  );
};

export default OTPPage;
