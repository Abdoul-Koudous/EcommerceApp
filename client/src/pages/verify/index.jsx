import React, { useState, useContext, useEffect, useRef } from "react";
import { postData } from "../utils/api";
import "./verify.scss";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { useNavigate } from "react-router";

const RESEND_COOLDOWN = 30; // secondes
const OTP_LENGTH = 6;

const Verify = () => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { openToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const hasChecked = useRef(false); // ✅ nouveau

  // ✅ garde : sans email en attente (inscription ou reset), impossible d'arriver ici
  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const email = localStorage.getItem("userEmail");
    const actionType = localStorage.getItem("actionType");

    if (!email) {
      openToast("error", "Session expirée, veuillez recommencer la procédure.");
      navigate(actionType === "forgot-password" ? "/login" : "/register", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 📌 Décompte du cooldown
  useEffect(() => {
    if (cooldown <= 0) return;

    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [cooldown]);

  // 📌 Gestion des inputs OTP (saisie manuelle, un chiffre)
  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < OTP_LENGTH - 1) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  // 📌 Navigation clavier : Backspace pour reculer, flèches gauche/droite
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        return;
      }
      if (index > 0) {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        document.getElementById(`otp-${index - 1}`).focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      document.getElementById(`otp-${index - 1}`).focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // 📌 Collage du code entier (Ctrl+V / Cmd+V, n'importe quelle case)
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (!pasted) return;

    const newOtp = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    document.getElementById(`otp-${nextIndex}`)?.focus();
  };

  // 📌 Vérification OTP
  const handleSubmit = (e) => {
    e.preventDefault();

    const actionType = localStorage.getItem("actionType");
    const email = localStorage.getItem("userEmail");
    const code = otp.join("");

    setLoading(true);

    // 🔥 Cas : mot de passe oublié
    if (actionType === "forgot-password") {
      postData("/api/users/verify-forgot-password-otp", { email, otp: code })
        .then((res) => {
          if (res?.error === false) {
            openToast("success", res?.message);

            // ✅ le backend renvoie un resetToken à usage unique, on le stocke
            // temporairement pour l'envoyer à /reset-password
            if (res?.resetToken) {
              localStorage.setItem("resetToken", res.resetToken);
            }

            // 🔑 OTP validé → aller vers reset password
            setTimeout(() => {
              navigate("/resetpassword");
            }, 800);
          } else {
            openToast("error", res?.message);
          }
        })
        .finally(() => setLoading(false));

      return;
    }

    // 🔥 Cas : vérification d'email normale (inscription)
    postData("/api/users/verifyEmail", { email, otp: code })
      .then((res) => {
        if (res?.error === false) {
          openToast("success", res?.message);
          localStorage.removeItem("userEmail"); // ici on supprime après inscription
          setTimeout(() => {
            navigate("/login");
          }, 800);
        } else {
          openToast("error", res?.message);
        }
      })
      .finally(() => setLoading(false));
  };

  // 📌 Renvoi du code OTP
  const handleResend = (e) => {
    e.preventDefault();

    if (resending || cooldown > 0) return;

    const actionType = localStorage.getItem("actionType");
    const email = localStorage.getItem("userEmail");

    if (!email) {
      openToast("error", "Adresse email introuvable, veuillez recommencer.");
      return;
    }

    setResending(true);
    localStorage.removeItem("resetToken"); // ✅ un nouveau code annule l'ancien token de reset

    const endpoint =
      actionType === "forgot-password"
        ? "/api/users/resend-forgot-password-otp"
        : "/api/users/resendOtp";

    postData(endpoint, { email })
      .then((res) => {
        if (res?.error === false) {
          openToast("success", res?.message || "Code renvoyé avec succès.");
          setOtp(Array(OTP_LENGTH).fill(""));
          document.getElementById("otp-0")?.focus();
          setCooldown(RESEND_COOLDOWN);
        } else {
          openToast("error", res?.message || "Échec du renvoi du code.");
        }
      })
      .catch(() => {
        openToast("error", "Échec du renvoi du code.");
      })
      .finally(() => setResending(false));
  };

  return (
    <div className="verify-container">
      <div className="verify-box">
        <h2>Vérification OTP</h2>

        <p>
          Entrez le code envoyé à : <br />
          <span className="user-email">{localStorage.getItem("userEmail")}</span>
        </p>

        <form className="otp-form" onSubmit={handleSubmit}>
          <div className="otp-inputs">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={handlePaste}
                disabled={loading}
              />
            ))}
          </div>

          <button type="submit" className="verify-btn" disabled={loading}>
            {loading ? <CircularProgress /> : "Vérifier"}
          </button>
        </form>

        <p className="resend-text">
          Pas reçu ?{" "}
          {cooldown > 0 ? (
            <span className="resend-cooldown">Renvoyer dans {cooldown}s</span>
          ) : (
            <a href="#" onClick={handleResend} aria-disabled={resending}>
              {resending ? "Envoi..." : "Renvoyer le code"}
            </a>
          )}
        </p>
      </div>
    </div>
  );
};

export default Verify;