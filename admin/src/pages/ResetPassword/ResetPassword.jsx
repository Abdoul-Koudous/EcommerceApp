import React, { useState, useContext } from "react";
import { FaLock, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import "./resetpassword.scss";
import { useNavigate } from "react-router-dom";
import { ToastContext } from "../../context/ToastContext";
import { postData } from "../utils/api";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { openToast } = useContext(ToastContext);

  // -------------------------
  // Formulaire avec email + newPassword + confirmPassword
  // -------------------------
  const [formFields, setFormFields] = useState({
    email: localStorage.getItem("userEmail") || "",
    newPassword: "",
    confirmPassword: "",
  });

  // Gestion affichage mot de passe
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  const email = localStorage.getItem("userEmail");
  const { newPassword, confirmPassword } = formFields;

  if (!email) {
    return openToast("error", "Email introuvable. Veuillez refaire la demande de réinitialisation.");
  }
  if (!newPassword || !confirmPassword) {
    return openToast("error", "Veuillez remplir les deux champs du mot de passe");
  }
  if (newPassword !== confirmPassword) {
    return openToast("error", "Les mots de passe ne correspondent pas");
  }

  setLoading(true);
  try {
    const res = await postData("/api/users/reset-password", { email, newPassword, confirmPassword });

    if (res?.success) {
      openToast("success", res.message);
      localStorage.removeItem("userEmail");
      setTimeout(() => navigate("/login"), 800);
    } else {
      openToast("error", res.message || "Erreur lors de la réinitialisation");
    }
  } catch (err) {
    console.error(err);
    openToast("error", "Erreur serveur");
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="resetpass-page">
      <div className="logo">🛒 YebouShop</div>

      <h2>Changer votre mot de passe</h2>
      <p className="subtitle">Définissez un nouveau mot de passe sécurisé</p>

      <form className="resetpass-form" onSubmit={handleSubmit}>
        {/* Nouveau mot de passe */}
        <div className="form-group">
          <FaLock className="input-icon" />
          <input
            type={showNewPassword ? "text" : "password"}
            name="newPassword"
            placeholder="Nouveau mot de passe"
            value={formFields.newPassword}
            onChange={handleChange}
            disabled={loading}
          />
          <span
            className="toggle"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        {/* Confirmer mot de passe */}
        <div className="form-group">
          <FaLock className="input-icon" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirmer le mot de passe"
            value={formFields.confirmPassword}
            onChange={handleChange}
            disabled={loading}
          />
          <span
            className="toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button type="submit" className="resetpass-btn" disabled={loading}>
          {loading ? <CircularProgress /> : "Changer le mot de passe"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
