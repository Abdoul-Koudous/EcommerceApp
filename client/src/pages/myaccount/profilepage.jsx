import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./profiletab.scss";
import { UserContext } from "../../UserContext/UserContext";
import { ToastContext } from "../../context/ToastContext";
import { editData, postData, uploadImage } from "../utils/api";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

const EMPTY_PASSWORD_DATA = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const ProfilePage = () => {
  const { user, setUser } = useContext(UserContext);
  const { openToast } = useContext(ToastContext);
  const navigate = useNavigate();

  // Compte créé via Google : pas de vrai mot de passe en base
  const isGoogleAccount = user?.signUpWithGoogle === true;

  const [profileEdit, setProfileEdit] = useState(false);
  const [passwordEdit, setPasswordEdit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [previews, setPreviews] = useState([]);

  const [profileData, setProfileData] = useState({ name: "", mobile: "" });
  const [passwordData, setPasswordData] = useState(EMPTY_PASSWORD_DATA);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordBlock, setShowPasswordBlock] = useState(false);

  useEffect(() => {
    if (user) setProfileData({ name: user.name || "", mobile: user.mobile || "" });
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const cancelProfile = () => {
    setProfileEdit(false);
    setProfileData({ name: user?.name || "", mobile: user?.mobile || "" });
  };

  const cancelPassword = () => {
    setPasswordEdit(false);
    setPasswordData(EMPTY_PASSWORD_DATA);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);
    try {
      const res = await editData(`/api/users/${user._id}`, profileData);
      if (res.error) return openToast("error", res.message);
      setUser({ ...user, ...res.user });
      openToast("success", res.message || "Profil mis à jour !");
      setProfileEdit(false);
    } catch (err) {
      openToast("error", err.message || "Erreur serveur");
    } finally {
      setSubmittingProfile(false);
    }
  };

  // Changement de mot de passe (comptes classiques uniquement)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      return openToast("error", "Veuillez saisir votre mot de passe actuel");
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return openToast("error", "Les mots de passe ne correspondent pas");
    }

    setSubmittingPassword(true);
    try {
      const res = await editData(`/api/users/change-password`, passwordData);
      if (res.error) return openToast("error", res.message);
      openToast("success", res.message || "Mot de passe mis à jour !");
      cancelPassword();
    } catch (err) {
      openToast("error", err.message || "Erreur serveur");
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Compte Google : on prouve la propriété de l'email via un code OTP,
  // puis la page /verify prend le relais (même flux que « mot de passe oublié »)
  const handleSendOtp = async () => {
    if (!user?.email) {
      return openToast("error", "Utilisateur non chargé");
    }
    setSendingOtp(true);
    try {
      const res = await postData("/api/users/forgot-password", { email: user.email });
      if (res?.success === true) {
        openToast("success", res.message);
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("actionType", "forgot-password");
        navigate("/verify");
      } else {
        openToast("error", res?.message || "Erreur inconnue");
      }
    } catch (err) {
      openToast("error", err.message || "Erreur réseau");
    } finally {
      setSendingOtp(false);
    }
  };

  const onChangeFile = async (e, apiEndPoint) => {
    try {
      setUploading(true);
      const files = e.target.files;
      const formData = new FormData();
      for (let file of files) {
        if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
          setUploading(false);
          return openToast("error", "Image invalide");
        }
        formData.append("avatar", file);
      }
      const res = await uploadImage(apiEndPoint, formData);
      setUploading(false);
      if (res.error) return openToast("error", res.message);
      setPreviews([res.avatar]);
      setUser({ ...user, avatar: res.avatar });
      openToast("success", res.message || "Avatar mis à jour !");
    } catch (err) {
      setUploading(false);
      openToast("error", err.message || "Erreur upload");
    }
  };

  const passwordLabel = isGoogleAccount ? "Définir un mot de passe" : "Changer mon mot de passe";

  return (
    <>
      {/* PROFIL */}
      <div className="al-tab-content pt-tab">
        <div className="pt-htitle">
          <h2>Mon Profil</h2>
          <button type="button" onClick={() => setShowPasswordBlock((prev) => !prev)}>
            {showPasswordBlock ? "Fermer le mot de passe" : passwordLabel}
          </button>
        </div>

        <hr />
        <div className="pt-avatar-header">
          <div className="pt-avatar">
            {uploading ? (
              <CircularProgress />
            ) : (
              <img
                src={previews[0] || user?.avatar || "/user.jpg"}
                alt="User avatar"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.src = "/user.jpg";
                }}
              />
            )}
            <label htmlFor="avatar-upload" className="pt-change-avatar">Changer</label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onChangeFile(e, "/api/users/user-avatar")}
            />
          </div>
        </div>

        <form className="pt-form" onSubmit={handleProfileSubmit}>
          <div className="pt-field-group">
            <FaUser className="pt-input-icon" />
            <input
              type="text"
              name="name"
              placeholder=" "
              value={profileData.name}
              onChange={handleProfileChange}
              disabled={!profileEdit}
            />
            <label>Nom complet</label>
          </div>

          <div className="pt-field-group">
            <FaEnvelope className="pt-input-icon" />
            <input type="email" placeholder=" " value={user?.email || ""} disabled />
            <label>Email</label>
          </div>

          <div className="pt-field-group pt-phone-group">
            <PhoneInput
              international
              defaultCountry="bj"
              value={profileData.mobile}
              onChange={(value) => setProfileData((prev) => ({ ...prev, mobile: value }))}
              disabled={!profileEdit}
              placeholder="Numéro de téléphone"
            />
            <label>Téléphone</label>
          </div>

          <div className="pt-actions">
            {!profileEdit ? (
              <button type="button" className="pt-btn-edit" onClick={() => setProfileEdit(true)}>
                Modifier le profil
              </button>
            ) : (
              <div className="pt-edit-buttons">
                <button type="button" className="pt-btn-cancel" onClick={cancelProfile}>
                  Annuler
                </button>
                <button type="submit" className="pt-btn-save">
                  {submittingProfile ? <CircularProgress size={20} /> : "Enregistrer"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* MOT DE PASSE */}
      {showPasswordBlock && (
        <div className="al-tab-content pt-tab">
          <h2>{passwordLabel}</h2>
          <hr />

          {isGoogleAccount ? (
            // ----- Compte Google : définition via code OTP envoyé par email -----
            <div className="pt-form">
              <p>
                Vous vous êtes connecté avec Google. Pour définir un mot de passe, nous
                allons envoyer un code de vérification à <strong>{user?.email}</strong>.
              </p>
              <div className="pt-actions">
                <button
                  type="button"
                  className="pt-btn-save"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? <CircularProgress size={20} /> : "Recevoir le code"}
                </button>
              </div>
            </div>
          ) : (
            // ----- Compte classique : ancien + nouveau mot de passe -----
            <form className="pt-form" onSubmit={handlePasswordSubmit}>
              {/* Mot de passe actuel */}
              <div className="pt-field-group">
                <FaLock className="pt-input-icon" />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  placeholder=" "
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  disabled={!passwordEdit}
                />
                <label>Mot de passe actuel</label>
                <span
                  className="pt-toggle-password"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {/* Nouveau mot de passe */}
              <div className="pt-field-group">
                <FaLock className="pt-input-icon" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder=" "
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  disabled={!passwordEdit}
                />
                <label>Nouveau mot de passe</label>
                <span
                  className="pt-toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {/* Confirmer mot de passe */}
              <div className="pt-field-group">
                <FaLock className="pt-input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder=" "
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  disabled={!passwordEdit}
                />
                <label>Confirmer mot de passe</label>
                <span
                  className="pt-toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="pt-actions">
                {!passwordEdit ? (
                  <button type="button" className="pt-btn-edit" onClick={() => setPasswordEdit(true)}>
                    Modifier
                  </button>
                ) : (
                  <div className="pt-edit-buttons">
                    <button type="button" className="pt-btn-cancel" onClick={cancelPassword}>
                      Annuler
                    </button>
                    <button type="submit" className="pt-btn-save">
                      {submittingPassword ? <CircularProgress size={20} /> : "Enregistrer"}
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
};

export default ProfilePage;