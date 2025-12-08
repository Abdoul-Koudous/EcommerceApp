import React, { useState, useContext } from "react";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import "./register.scss";
import { ToastContext } from "../../context/ToastContext";
import { postData } from "../utils/api";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { useNavigate } from "react-router";

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { openToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const [formFields, setFormFields] = useState({
    name: "",
    email: "",
    password: ""
  });

  // 📌 Gère les inputs
  const onChangeInput = (e) => {
    setFormFields({ ...formFields, [e.target.name]: e.target.value });
  };

  // 📌 Action formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    postData("/api/users/register", formFields)
      .then((res) => {
        if (res.error) {
          openToast("error", res.message);
        } else {
          openToast("success", res.message);
          localStorage.setItem("userEmail", formFields.email);

          // 🚀 Redirection vers OTP
          navigate("/verify");
        }
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2 className="register-title">Créer un compte</h2>
        <p className="register-subtitle">Inscrivez-vous pour commencer</p>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              name="name"
              placeholder=" "
              value={formFields.name}
              onChange={onChangeInput}
              disabled={isLoading}
            />
            <label>Nom complet</label>
          </div>

          <div className="form-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder=" "
              value={formFields.email}
              onChange={onChangeInput}
              disabled={isLoading}
            />
            <label>Adresse email</label>
          </div>

          <div className="form-group">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder=" "
              value={formFields.password}
              onChange={onChangeInput}
              disabled={isLoading}
            />
            <label>Mot de passe</label>

            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit" className="btn-register" disabled={isLoading}>
            {isLoading ? <CircularProgress /> : "S'inscrire"}
          </button>
        </form>

        <div className="social-register">
          <p className="divider">ou continuer avec</p>
          <button className="btn-google">
            <FcGoogle className="google-icon" />
            Google
          </button>
        </div>

        <p className="login-text">
          Vous avez déjà un compte ? <a href="/login">Se connecter</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
