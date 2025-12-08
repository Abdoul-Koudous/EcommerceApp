import React, { useState } from "react";
import { FaEnvelope, FaCheckCircle } from "react-icons/fa";
import "./forgotpassword.scss";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return alert("Veuillez entrer votre adresse e-mail.");

    console.log("Lien envoyé à :", email);
    setShowPopup(true);

    setTimeout(() => setShowPopup(false), 3000);
  };

  return (
    <div className="forgot-page">
      {/* ✅ Popup confirmation */}
      {showPopup && (
        <div className="popup">
          <FaCheckCircle className="popup-icon" />
          <span>Le lien de réinitialisation a été envoyé ✅</span>
        </div>
      )}

      <div className="forgot-card">
        <h2 className="forgot-title">Mot de passe oublié</h2>
        <p className="forgot-subtitle">
          Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
        </p>

        <form className="forgot-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder=" "
            />
            <label htmlFor="email">Adresse e-mail</label>
          </div>

          <button type="submit" className="btn-forgot">
            Envoyer le lien
          </button>
        </form>

        <p className="back-text">
          Vous vous souvenez de votre mot de passe ?{" "}
          <a href="#">Connectez-vous</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
