import React, { useState, useContext } from "react";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import "./register.scss";
import { ToastContext } from "../../context/ToastContext";
import { postData } from "../utils/api";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { useNavigate, Link } from "react-router";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "../../firebase";
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

  const onChangeInput = (e) => {
    setFormFields({ ...formFields, [e.target.name]: e.target.value });
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          role: "UTILISATEUR"
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
          <button className="rg-btn-google" onClick={authWithGoogle}>
            <FcGoogle className="rg-google-icon" />
            Se connecter avec Google
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