import React, { useState, useContext } from "react";
import "./login.scss";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaFacebookF,
} from "react-icons/fa";
import { postData } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { UserContext } from "../../UserContext/UserContext";

const LoginForm = () => {
  const { openToast } = useContext(ToastContext);
  const { loadUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await postData("/api/users/login", { email, password });

      if (res?.success) {
        // Vérification du rôle : seuls les comptes ADMIN peuvent accéder au dashboard admin
        if (res.data.role !== "ADMIN") {
          openToast("error", "Accès réservé aux administrateurs");

          // On nettoie les cookies déjà posés par le backend (accessToken/refreshToken httpOnly)
          // pour éviter qu'un compte non-admin reste connecté silencieusement sur ce domaine
          try {
            await postData("/api/users/logout", {});
          } catch {
            // pas bloquant si ça échoue, l'utilisateur n'ira de toute façon pas plus loin
          }

          setLoading(false);
          return;
        }

        openToast("success", res.message);
        localStorage.setItem("accesstoken", res.data.accesstoken);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        localStorage.setItem("userEmail", email);

        setTimeout(() => loadUser(), 50);
        navigate("/"); // redirection après login
      } else {
        openToast("error", res.message);
      }
    } catch {
      openToast("error", "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    if (!email) return openToast("error", "Veuillez entrer votre email");

    setLoading(true);
    try {
      const res = await postData("/api/users/forgot-password", { email });
      if (res?.success) {
        openToast("success", res.message);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("actionType", "forgot-password");
        navigate("/otp");
      } else {
        openToast("error", res?.message || "Erreur inconnue");
      }
    } catch {
      openToast("error", "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Logo */}
      <div className="logo">🛒 YebouShop</div>

      {/* Welcome text */}
      <h2>Bienvenue sur Login</h2>

      {/* Social login buttons */}
      <div className="social-login">
        <button className="google">
          <FaGoogle className="icon" /> Connexion avec Google
        </button>
        <button className="facebook">
          <FaFacebookF className="icon" /> Connexion avec Facebook
        </button>
      </div>

      {/* Separator */}
      <div className="separator">
        <span>ou avec email</span>
      </div>

      {/* Form fields */}
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <FaEnvelope className="input-icon" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <FaLock className="input-icon" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="form-options">
          <label>
            <input type="checkbox" /> Se souvenir de moi
          </label>
          <a onClick={forgotPassword}>Mot de passe oublié ?</a>
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? <CircularProgress /> : "Se connecter"}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;