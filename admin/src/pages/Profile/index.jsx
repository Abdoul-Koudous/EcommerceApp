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

  /** ======= ÉTATS ======= **/
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

  /** ======= INITIALISATION ======= **/
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

  /** ======= HANDLERS ======= **/

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  /** Annuler profil */
  const cancelProfile = () => {
    setProfileEdit(false);
    setProfileData({
      name: user?.name || "",
      mobile: user?.mobile || "",
    });
  };

  /** Annuler password */
  const cancelPassword = () => {
    setPasswordEdit(false);
    setPasswordData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  /** ======= SUBMIT PROFIL ======= **/
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);
     // Validation mobile
    if (profileData.mobile) {
      const phoneRegex = /^\+?[0-9]{8,15}$/; // + optionnel, 8 à 15 chiffres
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
      openToast("error", res?.message || "Erreur serveur");
    } finally {
      setSubmittingProfile(false);
    }
  };

  /** ======= SUBMIT PASSWORD ======= **/
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
      openToast("error", res?.message || "Erreur serveur");
    } finally {
      setSubmittingPassword(false);
    }
  };

  /** ======= UPLOAD AVATAR ======= **/
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
        openToast("success",res?.message || "Avatar mis à jour !");
      } catch {
        setUploading(false);
        openToast("error", res?.message || "Erreur upload");
      }
    };

  /** ======= RENDER ======= **/
  return (
    <>
      <div className="profile-container">
        {/* AVATAR */}
        <div className="profile-left">
          <div className="avatar-wrapper">
           
            {uploading ? <CircularProgress /> : <img src={previews[0] || user?.avatar || "/user.jpg"} alt="User avatar" />}

            <label htmlFor="avatar-upload" className="change-avatar">
              Changer
            </label>
            <input id="avatar-upload" type="file" accept="image/*" hidden onChange={(e) => onChangeFile(e, "/api/users/user-avatar")} />
          </div>
        </div>

        {/* FORMULAIRE */}
        <div className="profile-right">
          
          {/* HEADER */}
          <div className="profile-header">
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
          <form className="profile-form" onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <FaUser className="input-icon" />
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

            <div className="form-group">
              <FaEnvelope className="input-icon" />
              <input type="email" value={user?.email || ""} disabled />
              <label>Email</label>
            </div>

            <div className="form-group">
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
            <div className="address-block">
              <button
                type="button"
                className="btn-flat"
                onClick={() => setShowAddressDialog(true)}
              >
                Gérer mes adresses
              </button>

              <div className="address-selection">
                {addresses.length > 0 ? (
                  addresses.map((addr) => (
                    <label key={addr._id} className="address-radio">
                      <input
                        type="radio"
                        name="selectedAddress"
                        value={addr._id}
                        checked={selectedAddress === addr._id}
                        onChange={() => setSelectedAddress(addr._id)}
                      />
                      <span className="address-text">{addr.address_line1}</span>
                    </label>
                  ))
                ) : (
                  <p>Aucune adresse trouvée</p>
                )}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="actions">
              {!profileEdit ? (
                <button
                  type="button"
                  className="btn-edit"
                  onClick={() => setProfileEdit(true)}
                >
                  Modifier
                </button>
              ) : (
                <div className="edit-buttons">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={cancelProfile}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn-save">
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
              className="profile-form password-form"
              onSubmit={handlePasswordSubmit}
            >
              {/* Ancien */}
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
                <span
                  className="toggle-password"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {/* Nouveau */}
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
                <span
                  className="toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {/* Confirmation */}
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
                <span
                  className="toggle-password"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="actions">
                {!passwordEdit ? (
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => setPasswordEdit(true)}
                  >
                    Modifier
                  </button>
                ) : (
                  <div className="edit-buttons">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={cancelPassword}
                    >
                      Annuler
                    </button>
                    <button type="submit" className="btn-save">
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
