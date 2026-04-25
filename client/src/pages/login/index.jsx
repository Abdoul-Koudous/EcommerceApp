import React, { useState, useContext } from "react";
import "./login.scss";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { postData } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
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
      .then((res) => {
        if (res?.success === true) {
          openToast("success", res?.message);

          // sauvegarde du user dans localStorage si tu veux
          localStorage.setItem("accesstoken", res?.data?.accesstoken);
          localStorage.setItem("refreshToken", res?.data?.refreshToken);
          localStorage.setItem("userEmail", email);
          setTimeout(() => {
            loadUser();
          }, 50);

          navigate("/"); // ou une autre page
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
  },[]);

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

  // 📌 Authentification Google
  const authWithGoogle = () => {
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
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
          .then((res) => {
            if (res.error) {
              openToast("error", res.message);
            } else {
              openToast("success", res.message);
              localStorage.setItem("userEmail", fields.email);
              localStorage.setItem("accesstoken", res?.data?.accesstoken);
              localStorage.setItem("refreshToken", res?.data?.refreshToken);
              setTimeout(() => {
                loadUser();
              }, 50);

              // 🚀 Redirection vers OTP
              navigate("/");
            }
          })
          .finally(() => setIsLoading(false));

        console.log("Google user:", user);
        // IdP data available using getAdditionalUserInfo(result)
        // ...
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Se Connecter</h2>
        <p className="login-subtitle">
          Bienvenue ! Connectez-vous à votre compte
        </p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Champ email */}
          <div className="form-group">
            <FaEnvelope className="input-icon" />
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
          <div className="form-group">
            <FaLock className="input-icon" />
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
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="form-options">
            <label className="remember">
              <input type="checkbox" />
              <span>Se souvenir de moi</span>
            </label>
            <a className="forgot-link" onClick={forgotPassword}>
              Mot de passe oublié ?
            </a>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <CircularProgress /> : "Se connecter"}
          </button>

          <div className="social-login">
            <p className="divider">ou continuer avec</p>
            <button
              type="button"
              className="btn-google"
              onClick={authWithGoogle}
            >
              <FcGoogle className="google-icon" />
              Se connecter avec Google
            </button>
          </div>

          <p className="register-text">
            Pas encore de compte ? <a href="/register">Inscrivez-vous</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
