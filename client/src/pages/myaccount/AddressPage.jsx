import React, { useState, useEffect, useContext } from "react";
import { FaTimes,FaTrash  } from "react-icons/fa";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import "./address.scss";

import { ToastContext } from "../../context/ToastContext";
import { deleteData, fetchDataFromApi, postData } from "../utils/api";
import { UserContext } from "../../UserContext/UserContext";

const AddressPage = () => {
  const { openToast } = useContext(ToastContext);
  const { user } = useContext(UserContext);

  const [showDialog, setShowDialog] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
const [selectedAddress, setSelectedAddress] = useState(null);


  const [formFields, setFormFields] = useState({
    address_line1: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    mobile: "",
    status: true,
    userId: user?._id,
    selected: false,
  });

  // Disable scroll when dialog is open
  useEffect(() => {
    if (showDialog) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, [showDialog]);

  const handleOpen = () => setShowDialog(true);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowDialog(false);
      setIsClosing(false);
    }, 400);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Required fields
    for (const key of ["address_line1", "city", "state", "pincode", "country", "mobile"]) {
      if (!formFields[key]) {
        openToast("error", `${key} est requis`);
        setIsLoading(false);
        return;
      }
    }

    const res = await postData("/api/address/add", formFields, { withCredentials: true });

    if (res?.error === false) {
      openToast("success", res?.message);
      handleClose();
    } else {
      openToast("error", res?.message || "Erreur serveur");
    }

    setIsLoading(false);
  };

 

useEffect(() => {
  if (user?._id) {
    fetchDataFromApi(`/api/address/get?userId=${user._id}`)
      .then((res) => {
        if (!res.error) {
          setAddresses(res.data);
          const selected = res.data.find(addr => addr.selected);
          if (selected) setSelectedAddress(selected._id);
        }
      });
  }
}, [user]);


const removeAddress = async (id) => {
    const res = await deleteData(`/api/address/${id}`);

    if (!res.error) {
        setAddresses(prev => prev.filter(a => a._id !== id));
        openToast("success", res?.message || "Adresse supprimée");
    } else {
        openToast("error", res?.message ||"Impossible de supprimer");
    }
    };

  return (
    <>
      <div className="tab-content address-page">
        <h2>Mes Adresses</h2>
        <hr />

        {/* BOUTON LARGE */}
        <button className="btn-add-address" onClick={handleOpen}>
          + Ajouter une Adresse
        </button>
        {/* LISTE DES ADRESSES */}
        <div className="address-list">
        {addresses.length === 0 ? (
            <p className="no-address">Aucune adresse enregistrée.</p>
        ) : (
            addresses.map((addr) => (
            <div className="address-item" key={addr._id}>
                
                <input
                type="radio"
                name="selectedAddress"
                checked={selectedAddress === addr._id}
                onChange={() => handleSelect(addr._id)}
                />

                <div className="address-info">
                <p><strong>{addr.address_line1}</strong></p>
                <p>{addr.city}, {addr.state}</p>
                <p>{addr.country} - {addr.pincode}</p>
                <p>Tél : {addr.mobile}</p>
                </div>

               <button className="delete-btn" onClick={() => removeAddress(addr._id)}>
                <FaTrash />
                </button>


            </div>
            ))
        )}
        </div>

      </div>
      

      {/* DIALOG */}
      {showDialog && (
        <div className="dialog-overlay">
          <div className={`dialog-box ${isClosing ? "closing" : "opening"}`}>

            <div className="dialog-header">
              <button className="close-btn" onClick={handleClose}>
                <FaTimes />
              </button>
              <h3>Ajouter une nouvelle adresse</h3>
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
                </div>

                {/* Ligne 2 */}
                <div className="row">
                  <input
                    type="text"
                    name="city"
                    placeholder="Ville"
                    value={formFields.city}
                    onChange={handleInputChange}
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="État / Région"
                    value={formFields.state}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Ligne 3*/}
                <div className="row">
                  
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

                {/* Ligne 4*/}
                <div className="row plus">
                  <PhoneInput
                    international
                    defaultCountry="bj"
                    value={formFields.mobile}
                    onChange={(value) => setFormFields(prev => ({ ...prev, mobile: value }))}
                    placeholder="Téléphone"
                    />


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

                {/* Boutons */}
                <div className="dialog-footer">
                  <button type="button" className="btn-cancel" onClick={handleClose}>
                    Annuler
                  </button>

                  <button type="submit" className="btn-save" disabled={isLoading}>
                    {isLoading ? "En cours..." : "Enregistrer"}
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default AddressPage;
