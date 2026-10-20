import React, { useEffect, useState, useContext, useCallback } from "react";
import { FaEdit, FaTrash, FaPlus, FaSave } from "react-icons/fa";
import "./settings.scss";
import {
  fetchDataFromApi,
  editData,
  postData,
  deleteData,
  uploadImages,
} from "../utils/api";
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
  const [paymentMethods, setPaymentMethods] = useState({
    fedapay: true,
    kkiapay: true,
    cashOnDelivery: true,
  });
  const [savingPayments, setSavingPayments] = useState(false);
  const [storeIdentity, setStoreIdentity] = useState({
    name: "YebouShop",
    logoLight: "",
    logoDark: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    promoBanner: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      tiktok: "",
      linkedin: "",
    },
  });
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState("");

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    const res = await fetchDataFromApi("/api/settings");
    if (!res?.error && res?.settings) {
      setDefaultTaxRate(res.settings.defaultTaxRate ?? 0);
      setDefaultShippingFee(res.settings.defaultShippingFee ?? 0);
      setCurrency(res.settings.currency ?? "FCFA");
      setPaymentMethods({
        fedapay: res.settings.paymentMethods?.fedapay !== false,
        kkiapay: res.settings.paymentMethods?.kkiapay !== false,
        cashOnDelivery: res.settings.paymentMethods?.cashOnDelivery !== false,
      });
      setStoreIdentity((current) => ({
        ...current,
        ...res.settings.storeIdentity,
        socialLinks: {
          ...current.socialLinks,
          ...res.settings.storeIdentity?.socialLinks,
        },
      }));
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
    } catch {
      openToast("error", "Erreur serveur lors de la mise à jour");
    }
    setSavingSettings(false);
  };

  const handleSaveIdentity = async () => {
    setSavingIdentity(true);
    try {
      const res = await editData("/api/settings", { storeIdentity });
      if (!res?.error) {
        setStoreIdentity((current) => ({
          ...current,
          ...res.settings?.storeIdentity,
          socialLinks: {
            ...current.socialLinks,
            ...res.settings?.storeIdentity?.socialLinks,
          },
        }));
        openToast("success", "Identité de la boutique mise à jour");
      } else {
        openToast("error", res?.message || "Erreur lors de la mise à jour");
      }
    } catch {
      openToast("error", "Erreur serveur lors de la mise à jour");
    }
    setSavingIdentity(false);
  };

  const handleLogoUpload = async (event, variant) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);
    setUploadingLogo(variant);
    try {
      const res = await uploadImages(`/api/settings/logo/${variant}`, formData);
      if (!res?.error && res?.logoUrl) {
        setStoreIdentity((current) => ({
          ...current,
          [variant]: res.logoUrl,
        }));
        openToast("success", "Logo téléversé et enregistré");
      } else {
        openToast("error", res?.message || "Impossible de téléverser le logo");
      }
    } catch {
      openToast("error", "Erreur serveur lors du téléversement du logo");
    }
    setUploadingLogo("");
  };

  const hasEnabledPaymentMethod = Object.values(paymentMethods).some(Boolean);

  const handleTogglePaymentMethod = (key) => {
    setPaymentMethods((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePayments = async () => {
    if (!hasEnabledPaymentMethod) {
      openToast(
        "error",
        "Activez au moins un moyen de paiement avant d'enregistrer"
      );
      return;
    }

    setSavingPayments(true);
    try {
      const res = await editData("/api/settings", { paymentMethods });

      if (!res?.error) {
        openToast("success", "Moyens de paiement mis à jour");
        if (res?.settings?.paymentMethods) {
          setPaymentMethods(res.settings.paymentMethods);
        }
      } else {
        openToast("error", res?.message || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      openToast("error", "Erreur serveur lors de la mise à jour");
    }
    setSavingPayments(false);
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

      <div className="settings-card">
        <h3>Identité de la boutique</h3>
        <p className="settings-card-desc">
          Ces informations personnalisent la boutique, son pied de page et les
          e-mails envoyés aux clients.
        </p>

        {loadingSettings ? (
          <div className="settings-loading"><CircularProgress /></div>
        ) : (
          <>
            <div className="settings-form-grid">
              <div className="settings-form-group">
                <label htmlFor="store-name">Nom de la boutique</label>
                <input
                  id="store-name"
                  type="text"
                  maxLength={100}
                  value={storeIdentity.name}
                  onChange={(event) =>
                    setStoreIdentity((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="settings-form-group">
                <label htmlFor="store-email">E-mail de contact</label>
                <input
                  id="store-email"
                  type="email"
                  value={storeIdentity.email}
                  onChange={(event) =>
                    setStoreIdentity((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="settings-form-group">
                <label htmlFor="store-phone">Téléphone</label>
                <input
                  id="store-phone"
                  type="tel"
                  value={storeIdentity.phone}
                  onChange={(event) =>
                    setStoreIdentity((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="settings-form-group">
                <label htmlFor="store-whatsapp">WhatsApp</label>
                <input
                  id="store-whatsapp"
                  type="tel"
                  value={storeIdentity.whatsapp}
                  onChange={(event) =>
                    setStoreIdentity((current) => ({
                      ...current,
                      whatsapp: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="settings-form-group">
                <label htmlFor="store-address">Adresse</label>
                <input
                  id="store-address"
                  type="text"
                  maxLength={300}
                  value={storeIdentity.address}
                  onChange={(event) =>
                    setStoreIdentity((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="settings-form-group">
                <label htmlFor="store-promo">Bandeau promotionnel</label>
                <input
                  id="store-promo"
                  type="text"
                  maxLength={180}
                  placeholder="Vide = bandeau masqué"
                  value={storeIdentity.promoBanner}
                  onChange={(event) =>
                    setStoreIdentity((current) => ({
                      ...current,
                      promoBanner: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="settings-form-grid">
              {[
                ["facebook", "Facebook"],
                ["instagram", "Instagram"],
                ["tiktok", "TikTok"],
                ["linkedin", "LinkedIn"],
              ].map(([key, label]) => (
                <div className="settings-form-group" key={key}>
                  <label htmlFor={`store-social-${key}`}>{label}</label>
                  <input
                    id={`store-social-${key}`}
                    type="url"
                    placeholder="https://..."
                    value={storeIdentity.socialLinks[key]}
                    onChange={(event) =>
                      setStoreIdentity((current) => ({
                        ...current,
                        socialLinks: {
                          ...current.socialLinks,
                          [key]: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="settings-logo-grid">
              {[
                ["logoLight", "Logo pour le thème clair", "/logo-light.png"],
                ["logoDark", "Logo pour le thème sombre", "/logo-dark.png"],
              ].map(([variant, label, fallback]) => (
                <div className="settings-logo-field" key={variant}>
                  <label htmlFor={`store-${variant}`}>{label}</label>
                  <div className="settings-logo-preview">
                    <img
                      src={storeIdentity[variant] || fallback}
                      alt={label}
                    />
                  </div>
                  <input
                    id={`store-${variant}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => handleLogoUpload(event, variant)}
                    disabled={uploadingLogo === variant}
                  />
                  {uploadingLogo === variant && (
                    <span className="settings-logo-status">Téléversement...</span>
                  )}
                  {storeIdentity[variant] && (
                    <button
                      type="button"
                      className="settings-logo-reset"
                      onClick={() =>
                        setStoreIdentity((current) => ({
                          ...current,
                          [variant]: "",
                        }))
                      }
                    >
                      Utiliser le logo par défaut
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <button
          className="settings-save-btn"
          onClick={handleSaveIdentity}
          disabled={savingIdentity || loadingSettings || !!uploadingLogo}
        >
          <FaSave /> {savingIdentity ? "Enregistrement..." : "Enregistrer l'identité"}
        </button>
      </div>

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
          <FaSave />
          {savingSettings
            ? "Enregistrement..."
            : "Enregistrer les paramètres généraux"}
        </button>
      </div>

      <div className="settings-card">
        <h3>Moyens de paiement</h3>
        <p className="settings-card-desc">
          Activez uniquement ce que cette boutique propose. Les clés API
          FedaPay / KkiaPay restent dans le fichier d&apos;environnement du
          serveur. Au moins un moyen doit rester actif.
        </p>

        {loadingSettings ? (
          <div className="settings-loading"><CircularProgress /></div>
        ) : (
          <div className="settings-payment-list">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={paymentMethods.fedapay}
                onChange={() => handleTogglePaymentMethod("fedapay")}
              />
              <span>
                <strong>FedaPay</strong>
                <em>Paiement en ligne (Mobile Money, cartes)</em>
              </span>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={paymentMethods.kkiapay}
                onChange={() => handleTogglePaymentMethod("kkiapay")}
              />
              <span>
                <strong>KkiaPay</strong>
                <em>Paiement en ligne (Mobile Money, cartes)</em>
              </span>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={paymentMethods.cashOnDelivery}
                onChange={() => handleTogglePaymentMethod("cashOnDelivery")}
              />
              <span>
                <strong>Paiement à la livraison</strong>
                <em>Le client règle au moment de la réception</em>
              </span>
            </label>

            {!hasEnabledPaymentMethod && (
              <p className="settings-inline-error">
                Impossible de tout désactiver : le client ne pourrait plus
                commander.
              </p>
            )}
          </div>
        )}

        <button
          className="settings-save-btn"
          onClick={handleSavePayments}
          disabled={savingPayments || loadingSettings || !hasEnabledPaymentMethod}
        >
          <FaSave />
          {savingPayments
            ? "Enregistrement..."
            : "Enregistrer les moyens de paiement"}
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