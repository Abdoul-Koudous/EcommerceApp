import React, { useState, useContext, useEffect } from "react";
import "./profiletab.scss";
import { UserContext } from "../../UserContext/UserContext";
import { ToastContext } from "../../context/ToastContext";
import { editData, postData, uploadImage } from "../utils/api";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const ProfilePage = () => {
  const { user, setUser } = useContext(UserContext);
  const { openToast } = useContext(ToastContext);

  const [profileEdit, setProfileEdit] = useState(false);
  const [passwordEdit, setPasswordEdit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [previews, setPreviews] = useState([]);

  const [profileData, setProfileData] = useState({ name: "", mobile: "" });
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordBlock, setShowPasswordBlock] = useState(false);


  useEffect(() => {
    if (user) setProfileData({ name: user.name || "", mobile: user.mobile || "" });
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const cancelProfile = () => {
    setProfileEdit(false);
    setProfileData({ name: user?.name || "", mobile: user?.mobile || "" });
  };

  const cancelPassword = () => {
    setPasswordEdit(false);
    setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return openToast("error", "Les mots de passe ne correspondent pas");
    }
    setSubmittingPassword(true);
    try {
      const res = await postData(`/api/users/reset-password`, { ...passwordData, email: user.email });
      if (!res.success) return openToast("error", res.message);
      openToast("success", res.message || "Mot de passe mis à jour !");
      cancelPassword();
    } catch (err) {
      openToast("error", err.message || "Erreur serveur");
    } finally {
      setSubmittingPassword(false);
    }
  };

  const onChangeFile = async (e, apiEndPoint) => {
    try {
      setUploading(true);
      const files = e.target.files;
      const formData = new FormData();
      for (let file of files) {
        if (!["image/jpeg","image/jpg","image/png","image/webp"].includes(file.type)) {
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
      openToast("success",res.message || "Avatar mis à jour !");
    } catch {
      setUploading(false);
      openToast("error", res.message || "Erreur upload");
    }
  };

  return (
    <>
      {/* PROFIL */}
      <div className="tab-content profile-tab">
        <div className="htitle">
          <h2>Mon Profil</h2>
          <button type="button" onClick={() => setShowPasswordBlock(prev => !prev)}>
            {showPasswordBlock ? "Fermer le mot de passe" : "Changer mon mot de passe"}
          </button>
        </div>

        <hr />
        <div className="profile-header">
          <div className="profile-avatar">
            {uploading ? <CircularProgress /> : <img src={previews[0] || user?.avatar || "/user.jpg"} alt="User avatar" />}
            <label htmlFor="avatar-upload" className="change-avatar">Changer</label>
            <input id="avatar-upload" type="file" accept="image/*" hidden onChange={(e) => onChangeFile(e, "/api/users/user-avatar")} />
          </div>
        </div>

        <form className="profile-form" onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <FaUser className="input-icon" />
            <input type="text" name="name" placeholder=" " value={profileData.name} onChange={handleProfileChange} disabled={!profileEdit} />
            <label>Nom complet</label>
          </div>
          <div className="form-group">
            <FaEnvelope className="input-icon" />
            <input type="email" placeholder=" " value={user?.email || ""} disabled />
            <label>Email</label>
          </div>
          <div className="form-group">
            <FaPhone className="input-icon" />
            <input type="text" name="mobile" placeholder=" " value={profileData.mobile} onChange={handleProfileChange} disabled={!profileEdit} />
            <label>Téléphone</label>
          </div>

          <div className="actions">
            {!profileEdit ? (
              <button type="button" className="btn-edit" onClick={() => setProfileEdit(true)}>Modifier le profil</button>
            ) : (
              <div className="edit-buttons">
                <button type="button" className="btn-cancel" onClick={cancelProfile}>Annuler</button>
                <button type="submit" className="btn-save">
                  {submittingProfile ? <CircularProgress size={20}/> : "Enregistrer"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* MOT DE PASSE */}
      {showPasswordBlock && (<div className="tab-content profile-tab">
        <h2>Changer mon mot de passe</h2>
        <hr />
        <form className="profile-form" onSubmit={handlePasswordSubmit}>
          {/* Ancien mot de passe */}
          <div className="form-group">
            <FaLock className="input-icon" />
            <input
              type={showOldPassword ? "text" : "password"}
              name="oldPassword"
              placeholder=" "
              value={passwordData.oldPassword}
              onChange={handlePasswordChange}
              disabled={!passwordEdit}
            />
            <label>Ancien mot de passe</label>
            <span className="toggle-password" onClick={() => setShowOldPassword(!showOldPassword)}>
              {showOldPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Nouveau mot de passe */}
          <div className="form-group">
            <FaLock className="input-icon" />
            <input
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              placeholder=" "
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              disabled={!passwordEdit}
            />
            <label>Nouveau mot de passe</label>
            <span className="toggle-password" onClick={() => setShowNewPassword(!showNewPassword)}>
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Confirmer mot de passe */}
          <div className="form-group">
            <FaLock className="input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder=" "
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              disabled={!passwordEdit}
            />
            <label>Confirmer mot de passe</label>
            <span className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="actions">
            {!passwordEdit ? (
              <button type="button" className="btn-edit" onClick={() => setPasswordEdit(true)}>Modifier</button>
            ) : (
              <div className="edit-buttons">
                <button type="button" className="btn-cancel" onClick={cancelPassword}>Annuler</button>
                <button type="submit" className="btn-save">
                  {submittingPassword ? <CircularProgress size={20}/> : "Enregistrer"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>)}
    </>
  );
};

export default ProfilePage;
