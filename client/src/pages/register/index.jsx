import React, { useState, useContext } from "react";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import "./register.scss";
import { ToastContext } from "../../context/ToastContext";
import { postData } from "../utils/api";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { useNavigate } from "react-router";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import {firebaseApp} from "../../firebase";
import { UserContext } from "../../UserContext/UserContext";
import { useEffect } from "react";
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

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

  // 📌 Gère les inputs
  const onChangeInput = (e) => {
    setFormFields({ ...formFields, [e.target.name]: e.target.value });
  };
  useEffect(() => {
      window.scrollTo(0, 0);
    },[]);
  

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
        role: "UTILISATEUR"
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
    }).catch((error) => {
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
          <button className="btn-google" onClick={authWithGoogle}>
            <FcGoogle className="google-icon" />
            Se connecter avec Google
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
