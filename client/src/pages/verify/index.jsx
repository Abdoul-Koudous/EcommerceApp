import React, { useState, useContext } from "react";
import { postData } from "../utils/api";
import "./verify.scss";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { useNavigate } from "react-router";

const Verify = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const { openToast } = useContext(ToastContext);
  const navigate = useNavigate();

  // 📌 Gestion des inputs OTP
  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  // 📌 Vérification OTP
  const handleSubmit = (e) => {
    e.preventDefault();

    const actionType = localStorage.getItem("actionType");
    const email = localStorage.getItem("userEmail");
    const code = otp.join("");

    setLoading(true);

    // 🔥 Cas : mot de passe oublié
    if (actionType === "forgot-password") {
      postData("/api/users/verify-forgot-password-otp", { email, otp: code })
        .then((res) => {
          if (res?.error === false) {
            openToast("success", res?.message);

            // 🔑 OTP validé → aller vers reset password
            setTimeout(() => {
              navigate("/resetpassword");
            }, 800);
          } else {
            openToast("error", res?.message);
          }
        })
        .finally(() => setLoading(false));

      return;
    }

    // 🔥 Cas : vérification d'email normale (inscription)
    postData("/api/users/verifyEmail", { email, otp: code })
      .then((res) => {
        if (res?.error === false) {
          openToast("success", res?.message);
          localStorage.removeItem("userEmail"); // ici on supprime après inscription
          setTimeout(() => {
            navigate("/login");
          }, 800);
        } else {
          openToast("error", res?.message);
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="verify-container">
      <div className="verify-box">
        <h2>Vérification OTP</h2>

        <p>
          Entrez le code envoyé à :
          <span className="user-email">{localStorage.getItem("userEmail")}</span>
        </p>

        <form className="otp-form" onSubmit={handleSubmit}>
          <div className="otp-inputs">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                maxLength="1"
                value={digit}
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
    </div>
  );
};

export default Verify;
