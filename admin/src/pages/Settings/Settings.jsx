import React, { useEffect, useState, useContext, useCallback } from "react";
import { FaEdit, FaTrash, FaPlus, FaSave } from "react-icons/fa";
import "./settings.scss";
import { fetchDataFromApi, editData, postData, deleteData } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const Settings = () => {
  const { openToast } = useContext(ToastContext);

  // === Paramètres généraux ===
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [defaultShippingFee, setDefaultShippingFee] = useState(0);
  const [currency, setCurrency] = useState("FCFA");

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    const res = await fetchDataFromApi("/api/settings");
    if (!res?.error && res?.settings) {
      setDefaultTaxRate(res.settings.defaultTaxRate ?? 0);
      setDefaultShippingFee(res.settings.defaultShippingFee ?? 0);
      setCurrency(res.settings.currency ?? "FCFA");
    } else {
      openToast("error", "Impossible de charger les paramètres");
    }
    setLoadingSettings(false);
  }, [openToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await editData("/api/settings", {
        defaultTaxRate: Number(defaultTaxRate),
        defaultShippingFee: Number(defaultShippingFee),
        currency,
      });

      if (!res?.error) {
        openToast("success", "Paramètres mis à jour avec succès");
      } else {
        openToast("error", res?.message || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      openToast("error", "Erreur serveur lors de la mise à jour");
    }
    setSavingSettings(false);
  };

  // === Zones de livraison ===
  const [zones, setZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [selectedZones, setSelectedZones] = useState([]);

  const [zoneCity, setZoneCity] = useState("");
  const [zoneFee, setZoneFee] = useState("");
  const [editingZoneId, setEditingZoneId] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);

  const loadZones = useCallback(async () => {
    setLoadingZones(true);
    const res = await fetchDataFromApi("/api/shipping-zone");
    if (!res?.error) {
      setZones(res.zones || []);
    } else {
      openToast("error", "Impossible de charger les zones de livraison");
    }
    setLoadingZones(false);
  }, [openToast]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const resetZoneForm = () => {
    setZoneCity("");
    setZoneFee("");
    setEditingZoneId(null);
  };

  const handleEditZoneClick = (zone) => {
    setEditingZoneId(zone._id);
    setZoneCity(zone.city);
    setZoneFee(zone.fee);
  };

  const handleSubmitZone = async (e) => {
    e.preventDefault();

    if (!zoneCity.trim() || zoneFee === "") {
      openToast("error", "La ville et le montant sont requis");
      return;
    }

    try {
      let res;
      if (editingZoneId) {
        res = await editData(`/api/shipping-zone/update/${editingZoneId}`, {
          city: zoneCity.trim(),
          fee: Number(zoneFee),
        });
      } else {
        res = await postData("/api/shipping-zone/add", {
          city: zoneCity.trim(),
          fee: Number(zoneFee),
        });
      }

      if (!res?.error) {
        openToast(
          "success",
          editingZoneId ? "Zone mise à jour" : "Zone ajoutée avec succès"
        );
        resetZoneForm();
        loadZones();
      } else {
        openToast("error", res?.message || "Erreur serveur");
      }
    } catch (err) {
      openToast("error", "Erreur serveur");
    }
  };

  const handleDeleteZoneClick = (id) => {
    setToDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDeleteZone = async () => {
    try {
      if (toDeleteId) {
        const res = await deleteData(`/api/shipping-zone/${toDeleteId}`);
        if (!res?.error) {
          setZones((prev) => prev.filter((z) => z._id !== toDeleteId));
          openToast("success", "Zone supprimée");
        }
      } else if (selectedZones.length > 0) {
        const res = await deleteData("/api/shipping-zone/deleteMultiple", {
          ids: selectedZones,
        });
        if (!res?.error) {
          setZones((prev) => prev.filter((z) => !selectedZones.includes(z._id)));
          setSelectedZones([]);
          openToast("success", "Zones supprimées");
        }
      }
    } catch (err) {
      openToast("error", "Erreur serveur");
    }

    setConfirmOpen(false);
    setToDeleteId(null);
  };

  const handleSelectOneZone = (id) => {
    setSelectedZones((prev) =>
      prev.includes(id) ? prev.filter((zid) => zid !== id) : [...prev, id]
    );
  };

  return (
    <div className="settings-page">
      <h2 className="settings-title">Paramètres</h2>

      {/* === Section Général === */}
      <div className="settings-card">
        <h3>Général</h3>
        <p className="settings-card-desc">
          Ces valeurs s'appliquent par défaut à toute la boutique. Un produit
          ou une catégorie peut définir sa propre exception.
        </p>

        {loadingSettings ? (
          <div className="settings-loading"><CircularProgress /></div>
        ) : (
          <div className="settings-form-grid">
            <div className="settings-form-group">
              <label>Taux de taxe par défaut</label>
              <div className="settings-input-suffix">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={defaultTaxRate}
                  onChange={(e) => setDefaultTaxRate(e.target.value)}
                />
                <span>(ex: 0.18 pour 18%)</span>
              </div>
            </div>

            <div className="settings-form-group">
              <label>Frais de livraison par défaut</label>
              <div className="settings-input-suffix">
                <input
                  type="number"
                  min="0"
                  value={defaultShippingFee}
                  onChange={(e) => setDefaultShippingFee(e.target.value)}
                />
                <span>{currency}</span>
              </div>
            </div>

            <div className="settings-form-group">
              <label>Devise</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>
        )}

        <button
          className="settings-save-btn"
          onClick={handleSaveSettings}
          disabled={savingSettings || loadingSettings}
        >
          <FaSave /> {savingSettings ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      {/* === Section Zones de livraison === */}
      <div className="settings-card">
        <h3>Zones de livraison</h3>
        <p className="settings-card-desc">
          Défini un frais de livraison spécifique par ville. Si aucune zone
          ne correspond à la ville du client, le frais par défaut ci-dessus
          s'applique.
        </p>

        <form className="settings-zone-form" onSubmit={handleSubmitZone}>
          <div className="settings-form-group">
            <label>Ville</label>
            <input
              type="text"
              placeholder="Ex: Cotonou"
              value={zoneCity}
              onChange={(e) => setZoneCity(e.target.value)}
            />
          </div>

          <div className="settings-form-group">
            <label>Frais ({currency})</label>
            <input
              type="number"
              min="0"
              placeholder="Ex: 500"
              value={zoneFee}
              onChange={(e) => setZoneFee(e.target.value)}
            />
          </div>

          <button type="submit" className="settings-zone-submit-btn">
            <FaPlus /> {editingZoneId ? "Mettre à jour" : "Ajouter"}
          </button>

          {editingZoneId && (
            <button
              type="button"
              className="settings-zone-cancel-btn"
              onClick={resetZoneForm}
            >
              Annuler
            </button>
          )}
        </form>

        {selectedZones.length > 0 && (
          <button
            className="settings-delete-multiple-btn"
            onClick={() => {
              setToDeleteId(null);
              setConfirmOpen(true);
            }}
          >
            <FaTrash /> Supprimer <strong>{selectedZones.length}</strong>
          </button>
        )}

        {loadingZones ? (
          <div className="settings-loading"><CircularProgress /></div>
        ) : zones.length === 0 ? (
          <div className="settings-no-results">
            Aucune zone de livraison configurée pour le moment.
          </div>
        ) : (
          <div className="settings-zone-table-wrapper">
            <table className="settings-zone-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Ville</th>
                  <th>Frais</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedZones.includes(zone._id)}
                        onChange={() => handleSelectOneZone(zone._id)}
                      />
                    </td>
                    <td>{zone.city}</td>
                    <td>{Number(zone.fee).toLocaleString()} {currency}</td>
                    <td className="settings-zone-actions">
                      <button onClick={() => handleEditZoneClick(zone)}>
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDeleteZoneClick(zone._id)}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        message={
          toDeleteId
            ? "Voulez-vous vraiment supprimer cette zone ?"
            : `Voulez-vous vraiment supprimer ${selectedZones.length} zones ?`
        }
        onConfirm={handleConfirmDeleteZone}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default Settings;