import React, { useState, useEffect, useContext } from "react";
import { FaTimes } from "react-icons/fa";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./addressdialog.scss";

import { ToastContext } from "../../context/ToastContext";
import { postData } from "../utils/api";
import { UserContext } from "../../UserContext/UserContext";

const AddressDialog = ({ onClose }) => {

  const { openToast } = useContext(ToastContext);
  const { user } = useContext(UserContext);

  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formFields, setFormFields] = useState({
    address_line1: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    mobile: "",
    status: "",
    userId: user?._id,
    selected: false,
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 400);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    for (const key of ["address_line1","city","state","pincode","country","mobile"]) {
      if (!formFields[key]) {
        openToast("error", `${key} est requis`);
        setIsLoading(false);
        return;
      }
    }

    const res = await postData("/api/address/add", formFields, { withCredentials: true });

    if (res?.error === false) {
      openToast("success", res.data.message);
      handleClose();
    } else {
      openToast("error", res?.data?.message || "Erreur serveur");
    }
    setIsLoading(false);
  };

  return (
    <div className="fullscreen-dialog">
      <div className={`dialog-content ${isClosing ? "closing" : "opening"}`}>

        <div className="dialog-header">
          <div className="header-left">
            <button className="close-btn" onClick={handleClose}>
              <FaTimes />
            </button>
            <h2>Mes Adresses</h2>
          </div>
        </div>

        <div className="dialog-body">
          <form className="address-form" onSubmit={handleSubmit}>

            {/* Ligne 1 */}
            <div className="row">
              <input
                type="text"
                name="address_line1"
                placeholder="Adresse"
                value={formFields.address_line1}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="city"
                placeholder="Ville"
                value={formFields.city}
                onChange={handleInputChange}
              />
            </div>

            {/* Ligne 2 */}
            <div className="row">
              <input
                type="text"
                name="state"
                placeholder="État / Région"
                value={formFields.state}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="pincode"
                placeholder="Code postal"
                value={formFields.pincode}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="country"
                placeholder="Pays"
                value={formFields.country}
                onChange={handleInputChange}
              />
            </div>

            {/* Ligne 3 */}
            <div className="row plus">
              <PhoneInput
                international
                defaultCountry="BJ"
                value={formFields.mobile}
                onChange={(value) =>
                  setFormFields(prev => ({ ...prev, mobile: value }))
                }
                placeholder="Téléphone"
              />

              <select
                name="status"
                value={formFields.status ? "true" : "false"}
                onChange={(e) =>
                  setFormFields(prev => ({ ...prev, status: e.target.value === "true" }))
                }
              >
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </div>

            <button className="publish-btn" disabled={isLoading}>
              {isLoading ? "En cours..." : "Enregistrer"}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
};

export default AddressDialog;
