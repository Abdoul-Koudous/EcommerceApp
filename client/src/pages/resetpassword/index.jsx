import React, { useState, useContext, useEffect,useRef } from "react";
import { FaLock, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import "./resetpassword.scss";
import { useNavigate } from "react-router-dom";
import { ToastContext } from "../../context/ToastContext";
import { postData } from "../utils/api";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { openToast } = useContext(ToastContext);

  const [formFields, setFormFields] = useState({
    email: localStorage.getItem("userEmail") || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ garde : sans resetToken (donc sans OTP validé avant), impossible d'arriver ici
  const hasChecked = useRef(false);

useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const resetToken = localStorage.getItem("resetToken");
    const email = localStorage.getItem("userEmail");

    if (!resetToken || !email) {
      openToast("error", "Session expirée, veuillez recommencer la procédure.");
      navigate("/login", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const resetToken = localStorage.getItem("resetToken");

      const res = await postData("/api/users/reset-password", {
        ...formFields,
        resetToken, // ✅ requis par le backend désormais
      });

      if (res?.success) {
        openToast("success", res.message);
        localStorage.removeItem("userEmail");
        localStorage.removeItem("resetToken"); // ✅ à usage unique côté client aussi
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
    <div className="reset-page">
      <div className="reset-card">
        <div className="reset-header">
          <FaKey className="reset-icon" />
          <h2 className="reset-title">Réinitialiser le mot de passe</h2>
          <p className="reset-subtitle">
            Entrez et confirmez votre nouveau mot de passe.
          </p>
        </div>

        <form className="reset-form" onSubmit={handleSubmit}>
          {/* Nouveau mot de passe */}
          <div className="form-group">
            <FaLock className="input-icon" />
            <input
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              placeholder=" "
              value={formFields.newPassword}
              onChange={handleChange}
              disabled={loading}
            />
            <label>Nouveau mot de passe</label>
            <span
              className="toggle-password"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Confirmation mot de passe */}
          <div className="form-group">
            <FaLock className="input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder=" "
              value={formFields.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
            <label>Confirmer le mot de passe</label>
            <span
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit" className="btn-reset" disabled={loading}>
            {loading ? <CircularProgress /> : "Réinitialiser"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;