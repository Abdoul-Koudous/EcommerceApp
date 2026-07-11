import React, { useState, useEffect, useContext } from "react";
import { FaTrash } from "react-icons/fa";
import "./address.scss";

import { ToastContext } from "../../context/ToastContext";
import { deleteData, editData, fetchDataFromApi, postData } from "../utils/api";
import { UserContext } from "../../UserContext/UserContext";
import AddressPanel from "./addresspanel";

const AddressPage = () => {
  const { openToast } = useContext(ToastContext);
  const { user } = useContext(UserContext);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [editingAddress, setEditingAddress] = useState(null);

  const loadAddresses = () => {
    if (!user?._id) return;

    fetchDataFromApi(`/api/address/get?userId=${user._id}`).then((res) => {
      if (!res?.error) {
        setAddresses(res.data || []);
        const selected = (res.data || []).find((addr) => addr.selected);
        setSelectedAddress(selected ? selected._id : null);
      } else {
        openToast("error", res?.message || "Impossible de charger les adresses");
      }
    });
  };

  useEffect(() => {
    loadAddresses();
  }, [user]);

  const handleOpenAdd = () => {
    setMode("add");
    setEditingAddress(null);
    setPanelOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setMode("edit");
    setEditingAddress(addr);
    setPanelOpen(true);
    setOpenMenuId(null);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setMode("add");
    setEditingAddress(null);
  };

  const handleFormSubmit = async (formFields) => {
    if (!formFields.name.trim()) return openToast("error", "Le nom du destinataire est requis");
    if (!formFields.address_line1.trim()) return openToast("error", "L'adresse est requise");
    if (!formFields.city.trim()) return openToast("error", "La ville est requise");
    if (!formFields.state.trim()) return openToast("error", "L'état / la région est requis");
    if (!formFields.pincode.trim()) return openToast("error", "Le code postal est requis");
    if (!formFields.country.trim()) return openToast("error", "Le pays est requis");
    if (!formFields.mobile || formFields.mobile.trim().length < 8)
      return openToast("error", "Un numéro de téléphone valide est requis");

    try {
      let res;

      if (mode === "edit" && editingAddress) {
        res = await editData(`/api/address/update/${editingAddress._id}`, formFields);
      } else {
        res = await postData("/api/address/add", formFields);
      }

      if (res?.success) {
        openToast(
          "success",
          res?.message || (mode === "edit" ? "Adresse modifiée avec succès" : "Adresse ajoutée avec succès")
        );
        handleClosePanel();
        loadAddresses();
      } else {
        openToast("error", res?.message || "Erreur serveur");
      }
    } catch (err) {
      openToast("error", "Erreur réseau lors de l'enregistrement");
    }
  };

  const handleSelect = async (id) => {
    if (id === selectedAddress) return;

    const previous = selectedAddress;
    setSelectedAddress(id);

    try {
      const res = await editData(`/api/address/selectaddress/${id}`, { selected: true });

      if (res?.success) {
        openToast("success", "Adresse par défaut mise à jour");
        loadAddresses();
      } else {
        setSelectedAddress(previous);
        openToast("error", res?.message || "Erreur lors de la sélection");
      }
    } catch (err) {
      setSelectedAddress(previous);
      openToast("error", "Erreur serveur lors de la sélection");
    }
  };

  const removeAddress = async (id) => {
    try {
      const res = await deleteData(`/api/address/${id}`);

      if (res?.success) {
        setAddresses((prev) => prev.filter((a) => a._id !== id));
        openToast("success", res?.message || "Adresse supprimée");
      } else {
        openToast("error", res?.message || "Impossible de supprimer");
      }
    } catch (err) {
      openToast("error", "Erreur serveur lors de la suppression");
    }
  };

  return (
    <>
      <div className="tab-content address-page">
        <h2>Mes Adresses</h2>
        <hr />

        <button className="btn-add-address" onClick={handleOpenAdd}>
          + Ajouter une Adresse
        </button>

        <div className="address-list">
          {addresses.length === 0 ? (
            <p className="no-address">Aucune adresse enregistrée.</p>
          ) : (
            addresses.map((addr) => (
              <div
                className={`address-card ${selectedAddress === addr._id ? "selected" : ""}`}
                key={addr._id}
                onClick={() => handleSelect(addr._id)}
              >
                <div className="address-card-top">
                  <span className="address-badge">{addr.addressType}</span>

                  <div className="address-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="menu-btn"
                      onClick={() => setOpenMenuId(openMenuId === addr._id ? null : addr._id)}
                    >
                      ⋮
                    </button>

                    {openMenuId === addr._id && (
                      <div className="address-menu">
                        <button className="menu-item" onClick={() => handleOpenEdit(addr)}>
                          Modifier
                        </button>
                        <button
                          className="menu-item delete"
                          onClick={() => {
                            removeAddress(addr._id);
                            setOpenMenuId(null);
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="address-card-body">
                  <p className="address-name-line">
                    <strong>{addr.name}</strong>
                    <span className="address-phone">{addr.mobile}</span>
                  </p>

                  <p className="address-full">
                    {addr.address_line1}
                    {addr.landmark && `, ${addr.landmark}`}, {addr.city}, {addr.state} {addr.country}{" "}
                    {addr.pincode}
                  </p>
                </div>

                <input
                  type="radio"
                  name="selectedAddress"
                  className="address-radio"
                  checked={selectedAddress === addr._id}
                  onChange={() => handleSelect(addr._id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <AddressPanel
        isOpen={panelOpen}
        onClose={handleClosePanel}
        mode={mode}
        editingAddress={editingAddress}
        onSubmit={handleFormSubmit}
      />

      {panelOpen && <div className="address-panel-overlay" onClick={handleClosePanel} />}
    </>
  );
};

export default AddressPage;