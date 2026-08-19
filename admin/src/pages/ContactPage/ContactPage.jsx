import React, { useState, useEffect, useContext } from "react";
import { fetchDataFromApi, editData, uploadImages } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import { FaSave } from "react-icons/fa";
import "./contactpage.scss";
import ContactPreview from "../../components/ContactPreview/ContactPreview";
import LivePreviewFrame from "../../components/LivePreviewFrame/LivePreviewFrame";

const ContactPage = () => {
  const { openToast } = useContext(ToastContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    heroTag: "",
    heroTitle: "",
    heroSubtitle: "",
    heroImage: "",
    address: "",
    phone: "",
    email: "",
    hours: "",
    mapLat: "",
    mapLng: "",
    mapQuery: "",
  });

  useEffect(() => {
    fetchDataFromApi("/api/contact-page").then((res) => {
      if (res?.success) {
        setForm((prev) => ({ ...prev, ...res.data }));
      }
      setLoading(false);
    });
  }, []);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("images", file);

    setUploading(true);

    uploadImages("/api/contact-page/uploadImages", formData)
      .then((res) => {
        if (res?.success && res.images?.[0]) {
          setForm((prev) => ({ ...prev, heroImage: res.images[0] }));
          openToast("success", "Image téléchargée");
        } else {
          openToast("error", "Échec du téléchargement");
        }
      })
      .catch(() => openToast("error", "Erreur réseau lors de l'upload"))
      .finally(() => setUploading(false));
  };

  const handleSave = () => {
    setSaving(true);
    editData("/api/contact-page", form)
      .then((res) => {
        if (res?.success) {
          openToast("success", "Page Contact mise à jour");
        } else {
          openToast("error", res?.message || "Erreur lors de la mise à jour");
        }
      })
      .catch(() => openToast("error", "Erreur serveur"))
      .finally(() => setSaving(false));
  };

  if (loading) return <div className="contact-admin-loading">Chargement...</div>;

  return (
    <div className="contact-admin contact-admin--split">
      <div className="contact-admin__form-col">
        <div className="contact-admin__header">
          <h2>Page Contact</h2>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            <FaSave /> {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>

        <section className="admin-card">
          <h3>Section Hero</h3>
          <div className="form-group">
            <label>Tag</label>
            <input name="heroTag" value={form.heroTag} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Titre</label>
            <input name="heroTitle" value={form.heroTitle} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Sous-titre</label>
            <textarea rows="3" name="heroSubtitle" value={form.heroSubtitle} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Image de fond</label>
            {form.heroImage && <img src={form.heroImage} alt="hero" className="preview-img" />}
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            {uploading && <span className="uploading">Téléchargement...</span>}
          </div>
        </section>

        <section className="admin-card">
          <h3>Coordonnées</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Adresse</label>
              <input name="address" value={form.address} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input name="phone" value={form.phone} onChange={onChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Horaires</label>
              <input name="hours" value={form.hours} onChange={onChange} />
            </div>
          </div>
        </section>

        <section className="admin-card">
          <h3>Carte (Google Maps)</h3>
          <div className="form-group">
            <label>Requête simple (ville, pays) — utilisée si pas de coordonnées GPS</label>
            <input
              name="mapQuery"
              placeholder="ex: Abomey-Calavi,Benin"
              value={form.mapQuery}
              onChange={onChange}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Latitude (optionnel, plus précis)</label>
              <input name="mapLat" type="number" step="any" value={form.mapLat ?? ""} onChange={onChange} />
            </div>
            <div className="form-group">
              <label>Longitude (optionnel, plus précis)</label>
              <input name="mapLng" type="number" step="any" value={form.mapLng ?? ""} onChange={onChange} />
            </div>
          </div>
        </section>

        <button className="btn-save btn-save--bottom" onClick={handleSave} disabled={saving}>
          <FaSave /> {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>

            <div className="contact-admin__preview-col">
        <div className="preview-sticky">
          <p className="preview-label">Aperçu en direct</p>
          <div className="preview-frame">
            <LivePreviewFrame>
              <ContactPreview data={form} />
            </LivePreviewFrame>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;