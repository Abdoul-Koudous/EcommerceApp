import React, { useState, useContext } from "react";
import "./login.scss";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { postData } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import { useNavigate, Link } from "react-router-dom";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { UserContext } from "../../UserContext/UserContext";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "../../firebase";
import { useEffect } from "react";
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loadUser } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);

  const { openToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    setLoading(true);

    postData("/api/users/login", {
      email,
      password,
    })
      .then(async (res) => {
        if (res?.success === true) {
          openToast("success", res?.message);

          localStorage.setItem("accesstoken", res?.data?.accesstoken);
          localStorage.setItem("refreshToken", res?.data?.refreshToken);
          localStorage.setItem("userEmail", email);

          // ✅ on attend vraiment que le contexte soit à jour avant de naviguer,
          // plus de setTimeout arbitraire qui pouvait arriver trop tôt
          await loadUser();

          navigate("/");
        } else {
          openToast("error", res?.message);
        }
      })
      .catch(() => {
        openToast("error", "Erreur réseau");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const forgotPassword = () => {
    if (email === "") {
      openToast("error", "Veuillez s'il vous plaît entrer votre email");
      return;
    }

    setLoading(true);

    postData("/api/users/forgot-password", { email })
      .then((res) => {
        if (res?.success === true) {
          openToast("success", res.message);

          localStorage.setItem("userEmail", email);
          localStorage.setItem("actionType", "forgot-password");

          navigate("/verify");
        } else {
          openToast("error", res?.message || "Erreur inconnue");
        }
      })
      .catch(() => {
        openToast("error", "Erreur réseau");
      })
      .finally(() => setLoading(false));
  };

  const authWithGoogle = () => {
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;
        const fields = {
          name: user.providerData[0].displayName,
          email: user.providerData[0].email,
          password: null,
          avatar: user.providerData[0].photoURL,
          mobile: user.providerData[0].phoneNumber,
          role: "UTILISATEUR",
        };

        postData("/api/users/authWithGoogle", fields)
          .then(async (res) => {
            if (res.error) {
              openToast("error", res.message);
            } else {
              openToast("success", res.message);
              localStorage.setItem("userEmail", fields.email);
              localStorage.setItem("accesstoken", res?.data?.accesstoken);
              localStorage.setItem("refreshToken", res?.data?.refreshToken);

              // ✅ on attend vraiment que le contexte soit à jour, plus de setTimeout arbitraire
              await loadUser();

              navigate("/");
            }
          })
          .finally(() => setIsLoading(false));

        console.log("Google user:", user);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.customData.email;
        const credential = GoogleAuthProvider.credentialFromError(error);
      });
  };

  return (
    <div className="lg-page">
      <div className="lg-card">
        <h2 className="lg-title">Se Connecter</h2>
        <p className="lg-subtitle">
          Bienvenue ! Connectez-vous à votre compte
        </p>

        <form className="lg-form" onSubmit={handleSubmit} noValidate>
          {/* Champ email */}
          <div className="lg-field-group">
            <FaEnvelope className="lg-input-icon" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              autoComplete="username"
              required
            />
            <label htmlFor="email">Email</label>
          </div>

          {/* Champ mot de passe */}
          <div className="lg-field-group">
            <FaLock className="lg-input-icon" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              autoComplete="current-password"
              required
            />
            <label htmlFor="password">Mot de passe</label>
            <span
              className="lg-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="lg-form-options">
            <label className="lg-remember">
              <input type="checkbox" />
              <span>Se souvenir de moi</span>
            </label>
            <a className="lg-forgot-link" onClick={forgotPassword}>
              Mot de passe oublié ?
            </a>
          </div>

          <button type="submit" className="lg-btn-login" disabled={loading}>
            {loading ? <CircularProgress /> : "Se connecter"}
          </button>

          <div className="lg-social-login">
            <p className="lg-divider">ou continuer avec</p>
            <button
              type="button"
              className="lg-btn-google"
              onClick={authWithGoogle}
            >
              <FcGoogle className="lg-google-icon" />
              Se connecter avec Google
            </button>
          </div>

          <p className="lg-register-text">
            Pas encore de compte ? <Link to="/register">Inscrivez-vous</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;