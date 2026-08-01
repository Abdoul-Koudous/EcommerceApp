import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import "./addresspanel.scss";
import CircularProgress from "../../../components/CircularProgress/CircularProgress";

const initialFormFields = {
  name: "",
  address_line1: "",
  city: "",
  state: "",
  pincode: "",
  country: "",
  mobile: "+229",
  landmark: "",
  addressType: "Maison",
  status: true,
};

const AddressPanel = ({ isOpen, onClose, mode, editingAddress, onSubmit }) => {
  const [formFields, setFormFields] = useState(initialFormFields);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode === "edit" && editingAddress) {
      setFormFields({
        name: editingAddress.name || "",
        address_line1: editingAddress.address_line1 || "",
        city: editingAddress.city || "",
        state: editingAddress.state || "",
        pincode: editingAddress.pincode || "",
        country: editingAddress.country || "",
        mobile: editingAddress.mobile || "+229",
        landmark: editingAddress.landmark || "",
        addressType: editingAddress.addressType || "Maison",
        status: editingAddress.status ?? true,
      });
    } else {
      setFormFields(initialFormFields);
    }
  }, [mode, editingAddress, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onSubmit(formFields);
    setIsLoading(false);
  };

  return (
    <div className={`ap-panel ${isOpen ? "ap-open" : ""}`}>
      <div className="ap-header">
        <h3>{mode === "edit" ? "Modifier l'adresse" : "Ajouter une adresse"}</h3>
        <button className="ap-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <div className="ap-body">
        <form className="ap-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="ap-field-group">
            <label>Nom du destinataire</label>
            <input
              type="text"
              name="name"
              placeholder="Nom du destinataire"
              value={formFields.name}
              onChange={handleInputChange}
              autoComplete="off"
            />
          </div>

          <div className="ap-field-group">
            <label>Téléphone</label>
            <PhoneInput
              international
              defaultCountry="bj"
              value={formFields.mobile}
              onChange={(value) => setFormFields((prev) => ({ ...prev, mobile: value }))}
              placeholder="Téléphone"
              inputProps={{ autoComplete: "off" }}
            />
          </div>

          <div className="ap-field-group">
            <label>Adresse</label>
            <input
              type="text"
              name="address_line1"
              placeholder="Adresse (quartier, rue...)"
              value={formFields.address_line1}
              onChange={handleInputChange}
              autoComplete="off"
            />
          </div>

          <div className="ap-field-row">
            <div className="ap-field-group">
              <label>Ville</label>
              <input
                type="text"
                name="city"
                placeholder="Ville"
                value={formFields.city}
                onChange={handleInputChange}
                autoComplete="off"
              />
            </div>
            <div className="ap-field-group">
              <label>État / Région</label>
              <input
                type="text"
                name="state"
                placeholder="État / Région"
                value={formFields.state}
                onChange={handleInputChange}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="ap-field-row">
            <div className="ap-field-group">
              <label>Code postal</label>
              <input
                type="text"
                name="pincode"
                placeholder="Code postal"
                value={formFields.pincode}
                onChange={handleInputChange}
                autoComplete="off"
              />
            </div>
            <div className="ap-field-group">
              <label>Pays</label>
              <input
                type="text"
                name="country"
                placeholder="Pays"
                value={formFields.country}
                onChange={handleInputChange}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="ap-field-group">
            <label>Point de repère (optionnel)</label>
            <input
              type="text"
              name="landmark"
              placeholder="Point de repère (optionnel)"
              value={formFields.landmark}
              onChange={handleInputChange}
              autoComplete="off"
            />
          </div>

          <div className="ap-field-group">
            <label>Type d'adresse</label>
            <div className="ap-radio-options">
              <label>
                <input
                  type="radio"
                  name="addressType"
                  value="Maison"
                  checked={formFields.addressType === "Maison"}
                  onChange={handleInputChange}
                />
                Maison
              </label>
              <label>
                <input
                  type="radio"
                  name="addressType"
                  value="Bureau"
                  checked={formFields.addressType === "Bureau"}
                  onChange={handleInputChange}
                />
                Bureau
              </label>
            </div>
          </div>

          <div className="ap-field-group">
            <label>Statut</label>
            <select
              name="status"
              value={formFields.status ? "true" : "false"}
              onChange={(e) =>
                setFormFields((prev) => ({
                  ...prev,
                  status: e.target.value === "true",
                }))
              }
            >
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>

          <div className="ap-footer">
            <button type="button" className="ap-btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="ap-btn-save" disabled={isLoading}>
              {isLoading ? (
                <CircularProgress size={20} />
              ) : mode === "edit" ? (
                "Mettre à jour"
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressPanel;