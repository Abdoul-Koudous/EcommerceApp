import React, { useState, useContext, useEffect } from "react";
import "./profile.scss";
import { UserContext } from "../../UserContext/UserContext";
import { ToastContext } from "../../context/ToastContext";
import { editData, uploadImage, postData } from "../utils/api";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import AddressDialog from "./AddressDialog";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const Profile = () => {
  const { user, setUser, addresses, setAddresses } = useContext(UserContext);
  const { openToast } = useContext(ToastContext);

  const [profileEdit, setProfileEdit] = useState(false);
  const [passwordEdit, setPasswordEdit] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const [profileData, setProfileData] = useState({ name: "", mobile: "" });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [previews, setPreviews] = useState([]);
  const [showPasswordBlock, setShowPasswordBlock] = useState(false);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showAddressDialog, setShowAddressDialog] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        mobile: user.mobile || "",
      });

      if (addresses?.length > 0) {
        setSelectedAddress(addresses[0]._id);
      }
    }
  }, [user, addresses]);

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
    setProfileData({
      name: user?.name || "",
      mobile: user?.mobile || "",
    });
  };

  const cancelPassword = () => {
    setPasswordEdit(false);
    setPasswordData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);

    if (profileData.mobile) {
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      if (!phoneRegex.test(profileData.mobile)) {
        openToast("error", "Numéro de téléphone invalide");
        setSubmittingProfile(false);
        return;
      }
    }

    try {
      const res = await editData(`/api/users/${user._id}`, profileData);

      if (res.error) return openToast("error", res.message);

      setUser({ ...user, ...res.user });

      openToast("success", res?.message || "Profil mis à jour !");
      setProfileEdit(false);
    } catch (error) {
      // ✅ corrigé : "res" n'existe pas dans ce scope (déclaré dans le try),
      // provoquait un ReferenceError silencieux et aucun toast affiché
      openToast("error", error?.message || "Erreur serveur");
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
      const res = await postData(`/api/users/reset-password`, {
        ...passwordData,
        email: user.email,
      });

      if (!res.success) return openToast("error", res.message);

      openToast("success", res?.message || "Mot de passe mis à jour !");
      cancelPassword();
    } catch (error) {
      // ✅ corrigé, même bug que ci-dessus
      openToast("error", error?.message || "Erreur serveur");
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
      openToast("success", res?.message || "Avatar mis à jour !");
    } catch (error) {
      // ✅ corrigé, même bug
      setUploading(false);
      openToast("error", error?.message || "Erreur upload");
    }
  };

  return (
    <>
      <div className="prf-container">
        {/* AVATAR */}
        <div className="prf-left">
          <div className="prf-avatar-wrapper">
            {uploading ? <CircularProgress /> : <img src={previews[0] || user?.avatar || "/user.jpg"} alt="User avatar" />}

            <label htmlFor="avatar-upload" className="prf-change-avatar">
              Changer
            </label>
            <input id="avatar-upload" type="file" accept="image/*" hidden onChange={(e) => onChangeFile(e, "/api/users/user-avatar")} />
          </div>
        </div>

        {/* FORMULAIRE */}
        <div className="prf-right">

          {/* HEADER */}
          <div className="prf-header">
            <h2>Mon Profil</h2>
            <button
              type="button"
              onClick={() => setShowPasswordBlock((prev) => !prev)}
            >
              {showPasswordBlock
                ? "Fermer le mot de passe"
                : "Changer mon mot de passe"}
            </button>
          </div>

          {/* ====================== FORM PROFIL ====================== */}
          <form className="prf-form" onSubmit={handleProfileSubmit}>
            <div className="prf-form-group">
              <FaUser className="prf-input-icon" />
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

            <div className="prf-form-group">
              <FaEnvelope className="prf-input-icon" />
              <input type="email" value={user?.email || ""} disabled />
              <label>Email</label>
            </div>

            <div className="prf-form-group">
              <PhoneInput
                international
                defaultCountry="BJ"
                value={profileData.mobile}
                onChange={(value) =>
                  setProfileData((p) => ({ ...p, mobile: value }))
                }
                disabled={!profileEdit}
                placeholder="Téléphone"
              />
            </div>

            {/* ADRESSES */}
            <div className="prf-address-block">
              <button
                type="button"
                className="prf-btn-flat"
                onClick={() => setShowAddressDialog(true)}
              >
                Gérer mes adresses
              </button>

              <div className="prf-address-selection">
                {addresses.length > 0 ? (
                  addresses.map((addr) => (
                    <label key={addr._id} className="prf-address-radio">
                      <input
                        type="radio"
                        name="selectedAddress"
                        value={addr._id}
                        checked={selectedAddress === addr._id}
                        onChange={() => setSelectedAddress(addr._id)}
                      />
                      <span className="prf-address-text">{addr.address_line1}</span>
                    </label>
                  ))
                ) : (
                  <p>Aucune adresse trouvée</p>
                )}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="prf-actions">
              {!profileEdit ? (
                <button
                  type="button"
                  className="prf-btn-edit"
                  onClick={() => setProfileEdit(true)}
                >
                  Modifier
                </button>
              ) : (
                <div className="prf-edit-buttons">
                  <button
                    type="button"
                    className="prf-btn-cancel"
                    onClick={cancelProfile}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="prf-btn-save">
                    {submittingProfile ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Enregistrer"
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* ====================== MOT DE PASSE ====================== */}
          {showPasswordBlock && (
            <form
              className="prf-form prf-password-form"
              onSubmit={handlePasswordSubmit}
            >
              {/* Ancien */}
              <div className="prf-form-group">
                <FaLock className="prf-input-icon" />
                <input
                  type={showOldPassword ? "text" : "password"}
                  name="oldPassword"
                  placeholder=" "
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  disabled={!passwordEdit}
                />
                <label>Ancien mot de passe</label>
                <span
                  className="prf-toggle-password"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {/* Nouveau */}
              <div className="prf-form-group">
                <FaLock className="prf-input-icon" />
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
                  className="prf-toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {/* Confirmation */}
              <div className="prf-form-group">
                <FaLock className="prf-input-icon" />
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
                  className="prf-toggle-password"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="prf-actions">
                {!passwordEdit ? (
                  <button
                    type="button"
                    className="prf-btn-edit"
                    onClick={() => setPasswordEdit(true)}
                  >
                    Modifier
                  </button>
                ) : (
                  <div className="prf-edit-buttons">
                    <button
                      type="button"
                      className="prf-btn-cancel"
                      onClick={cancelPassword}
                    >
                      Annuler
                    </button>
                    <button type="submit" className="prf-btn-save">
                      {submittingPassword ? (
                        <CircularProgress size={20} />
                      ) : (
                        "Enregistrer"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {showAddressDialog && (
        <AddressDialog onClose={() => setShowAddressDialog(false)} />
      )}
    </>
  );
};

export default Profile;