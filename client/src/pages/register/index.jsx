import React, { useState, useContext } from "react";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import "./register.scss";
import { ToastContext } from "../../context/ToastContext";
import { postData } from "../utils/api";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { useNavigate, Link } from "react-router";
import { getFirebaseAuthErrorMessage } from "../../firebaseAuthError";
import {
  completeGoogleSignIn,
  startGoogleSignIn,
} from "../../googleAuth";
import { UserContext } from "../../UserContext/UserContext";
import { useEffect } from "react";

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loadUser } = useContext(UserContext);
  const { openToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const [formFields, setFormFields] = useState({
    name: "",
    email: "",
    password: ""
  });

  const onChangeInput = (e) => {
    setFormFields({ ...formFields, [e.target.name]: e.target.value });
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let cancelled = false;
    completeGoogleSignIn()
      .then(async (result) => {
        if (!result || cancelled) return;
        setIsLoading(true);
        await loadUser();
        if (cancelled) return;
        openToast("success", result.message);
        navigate("/");
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(
          "Échec de l'inscription Google:",
          error?.code,
          error?.message,
        );
        openToast(
          "error",
          error?.code
            ? getFirebaseAuthErrorMessage(error)
            : error.message || "L'inscription Google a échoué.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadUser, navigate, openToast]);

  // ⚠️ INCHANGÉ : l'inscription classique ne connecte pas directement
  // (redirection vers /verify pour l'OTP), donc pas de fusion de panier
  // ici — elle se fera au prochain login réel.
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

          navigate("/verify");
        }
      })
      .finally(() => setIsLoading(false));
  };

  const authWithGoogle = async () => {
  if (isLoading) return;
  setIsLoading(true);

  try {
    await startGoogleSignIn();
  } catch (error) {
    console.error("Échec de l'inscription Google:", error?.code, error?.message);
    openToast("error", getFirebaseAuthErrorMessage(error));
  } finally {
    setIsLoading(false);
  }
  };

  return (
    <div className="rg-page">
      <div className="rg-card">
        <h2 className="rg-title">Créer un compte</h2>
        <p className="rg-subtitle">Inscrivez-vous pour commencer</p>

        <form className="rg-form" onSubmit={handleSubmit}>
          <div className="rg-field-group">
            <FaUser className="rg-input-icon" />
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

          <div className="rg-field-group">
            <FaEnvelope className="rg-input-icon" />
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

          <div className="rg-field-group">
            <FaLock className="rg-input-icon" />
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
              className="rg-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit" className="rg-btn-register" disabled={isLoading}>
            {isLoading ? <CircularProgress /> : "S'inscrire"}
          </button>
        </form>

        <div className="rg-social-register">
          <p className="rg-divider">ou continuer avec</p>
          <button
            type="button"
            className="rg-btn-google"
            onClick={authWithGoogle}
            disabled={isLoading}
          >
            <FcGoogle className="rg-google-icon" />
            {isLoading ? <CircularProgress /> : "S'inscrire avec Google"}
          </button>
        </div>

        <p className="rg-login-text">
          Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;