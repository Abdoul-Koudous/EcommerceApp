import React, { useState, useContext } from "react";
import { FaGoogle, FaFacebookF, FaEye, FaEyeSlash } from "react-icons/fa";
import "./register.scss";
import { ToastContext } from "../../context/ToastContext";
import { postData } from "../utils/api";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { useNavigate } from "react-router";

const RegisterForm = () => {
  const { openToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // ✅ ajouté
  const [formFields, setFormFields] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // 📌 Gestion des inputs
  const onChangeInput = (e) => {
    setFormFields({ ...formFields, [e.target.name]: e.target.value });
  };

  // 📌 Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formFields.password !== formFields.confirmPassword) {
      return openToast("error", "Les mots de passe ne correspondent pas");
    }

    setIsLoading(true);

    try {
      const res = await postData("/api/users/register", formFields);

      if (res.error) {
        openToast("error", res.message);
      } else {
        openToast("success", res.message);

        // 🔑 Stocker email pour OTP
        localStorage.setItem("userEmail", formFields.email);
        localStorage.setItem("actionType", "register");

        // 🚀 Rediriger vers OTP
        navigate("/otp");
      }
    } catch (error) {
      openToast("error", "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rgs-page">
      <div className="rgs-logo">🛒 YebouShop</div>
      <h2>Bienvenue sur Register</h2>

      {/* Social Register */}
      <div className="rgs-social-register">
        <button className="rgs-google">
          <FaGoogle className="icon" /> S'inscrire avec Google
        </button>
        <button className="rgs-facebook">
          <FaFacebookF className="icon" /> S'inscrire avec Facebook
        </button>
      </div>

      {/* Séparateur */}
      <div className="rgs-separator">
        <span>ou avec email</span>
      </div>

      {/* Formulaire */}
      <form className="rgs-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Nom complet"
          value={formFields.name}
          onChange={onChangeInput}
          disabled={isLoading}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formFields.email}
          onChange={onChangeInput}
          disabled={isLoading}
        />
        <div className="rgs-password-group">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Mot de passe"
            value={formFields.password}
            onChange={onChangeInput}
            disabled={isLoading}
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <div className="rgs-password-group">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirmer le mot de passe"
            value={formFields.confirmPassword}
            onChange={onChangeInput}
            disabled={isLoading}
          />
          <span
            className="toggle-password"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="rgs-form-options">
          <label>
            <input type="checkbox" /> Accepter les termes et conditions
          </label>
        </div>

        <button type="submit" className="rgs-btn" disabled={isLoading}>
          {isLoading ? <CircularProgress size={20} /> : "S'inscrire"}
        </button>
      </form>

      <p className="rgs-login-text">
        Vous avez déjà un compte ? <a href="/login">Se connecter</a>
      </p>
    </div>
  );
};

export default RegisterForm;