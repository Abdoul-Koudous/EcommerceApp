import React, { useState, useContext } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import "./homeSlideForm.scss";
import { deleteImages, uploadImages } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const BADGE_COLORS = [
  { value: "accent", label: "Accent" },
  { value: "primary", label: "Primaire" },
  { value: "success", label: "Succès (vert)" },
  { value: "danger", label: "Urgence (rouge)" },
];

const emptyFields = {
  images: [],
  title: "",
  subtitle: "",
  badgeText: "",
  badgeColor: "accent",
  highlights: [],
  ctaText: "Découvrir",
  ctaLink: "",
  isActive: true,
  startDate: "",
  endDate: "",
  order: 0,
};

// Convertit une date ISO (venant de l'API) en "YYYY-MM-DD" pour un <input type="date">
const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

/**
 * Formulaire partagé Add/Edit. Le parent fournit :
 * - initialSlide (optionnel, pour l'édition)
 * - onSubmit(fields) -> Promise (le parent gère l'appel API postData/editData)
 * - submitLabel
 */
const HomeSlideForm = ({ initialSlide, onSubmit, submitLabel = "Publier" }) => {
  const { openToast } = useContext(ToastContext);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightDraft, setHighlightDraft] = useState("");

  const [fields, setFields] = useState(() =>
    initialSlide
      ? {
          images: initialSlide.images || [],
          title: initialSlide.title || "",
          subtitle: initialSlide.subtitle || "",
          badgeText: initialSlide.badgeText || "",
          badgeColor: initialSlide.badgeColor || "accent",
          highlights: initialSlide.highlights || [],
          ctaText: initialSlide.ctaText || "Découvrir",
          ctaLink: initialSlide.ctaLink || "",
          isActive: initialSlide.isActive ?? true,
          startDate: toDateInputValue(initialSlide.startDate),
          endDate: toDateInputValue(initialSlide.endDate),
          order: initialSlide.order ?? 0,
        }
      : emptyFields
  );

  const setField = (name, value) =>
    setFields((prev) => ({ ...prev, [name]: value }));

  // ─── Images ──────────────────────────────────────────────────────
  const removeImage = async (imgUrl, index) => {
    try {
      const res = await deleteImages(
        `/api/homeSlide/deleteImage?img=${encodeURIComponent(imgUrl)}`
      );
      if (res?.error) return openToast("error", res.message);

      setField(
        "images",
        fields.images.filter((_, i) => i !== index)
      );
      openToast("success", res?.message || "Image supprimée");
    } catch (err) {
      openToast("error", "Erreur suppression image");
    }
  };

  const onChangeFile = async (e) => {
    try {
      const files = e.target.files;
      if (!files.length) return;

      setUploading(true);
      const formData = new FormData();

      for (let file of files) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          setUploading(false);
          return openToast("error", "Format image invalide");
        }
        formData.append("images", file);
      }

      const res = await uploadImages("/api/homeSlide/uploadImages", formData);
      setUploading(false);

      if (res?.error) return openToast("error", res.message);

      setField("images", [...fields.images, ...res.images]);
      openToast("success", "Images uploadées");
      e.target.value = "";
    } catch (err) {
      setUploading(false);
      openToast("error", "Erreur upload");
    }
  };

  // ─── Highlights (max 3) ──────────────────────────────────────────
  const addHighlight = () => {
    const value = highlightDraft.trim();
    if (!value) return;
    if (fields.highlights.length >= 3) {
      return openToast("error", "Trois points forts maximum");
    }
    setField("highlights", [...fields.highlights, value]);
    setHighlightDraft("");
  };

  const removeHighlight = (index) => {
    setField(
      "highlights",
      fields.highlights.filter((_, i) => i !== index)
    );
  };

  const handleHighlightKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addHighlight();
    }
  };

  // ─── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (fields.images.length === 0) {
      return openToast("error", "Au moins une image est requise");
    }
    if (!fields.title.trim()) {
      return openToast("error", "Le titre est requis");
    }
    if (fields.startDate && fields.endDate && fields.startDate > fields.endDate) {
      return openToast("error", "La date de fin doit être après la date de début");
    }

    setLoading(true);
    try {
      await onSubmit({
        ...fields,
        title: fields.title.trim(),
        order: Number(fields.order) || 0,
        startDate: fields.startDate || null,
        endDate: fields.endDate || null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="hsf-form" onSubmit={handleSubmit}>
      {/* IMAGES */}
      <div className="hsf-field">
        <label>Images</label>
        <div className="hsf-images-wrapper">
          {fields.images.map((img, index) => (
            <div className="hsf-image-circle" key={img + index}>
              <img src={img} alt="slide" />
              <button
                type="button"
                className="hsf-remove-btn"
                onClick={() => removeImage(img, index)}
              >
                <FaTimes />
              </button>
            </div>
          ))}

          <label className={`hsf-image-circle hsf-add ${uploading ? "hsf-disabled" : ""}`}>
            {uploading ? <CircularProgress size={28} /> : <FaPlus />}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              disabled={uploading}
              onChange={onChangeFile}
            />
          </label>
        </div>
      </div>

      {/* TITRE / SOUS-TITRE */}
      <div className="hsf-field">
        <label htmlFor="hsf-title">Titre *</label>
        <input
          id="hsf-title"
          type="text"
          value={fields.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="Ventes Flash"
          maxLength={80}
          required
        />
      </div>

      <div className="hsf-field">
        <label htmlFor="hsf-subtitle">Sous-titre</label>
        <input
          id="hsf-subtitle"
          type="text"
          value={fields.subtitle}
          onChange={(e) => setField("subtitle", e.target.value)}
          placeholder="Jusqu'à -30% ce week-end seulement"
          maxLength={140}
        />
      </div>

      {/* BADGE */}
      <div className="hsf-row">
        <div className="hsf-field">
          <label htmlFor="hsf-badgeText">Badge</label>
          <input
            id="hsf-badgeText"
            type="text"
            value={fields.badgeText}
            onChange={(e) => setField("badgeText", e.target.value)}
            placeholder="-30%, Nouveau…"
            maxLength={20}
          />
        </div>

        <div className="hsf-field">
          <label htmlFor="hsf-badgeColor">Couleur du badge</label>
          <select
            id="hsf-badgeColor"
            value={fields.badgeColor}
            onChange={(e) => setField("badgeColor", e.target.value)}
          >
            {BADGE_COLORS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {fields.badgeText && (
        <div className="hsf-field">
          <label>Aperçu du badge</label>
          <span className={`hsf-badge-preview hsf-badge-${fields.badgeColor}`}>
            {fields.badgeText}
          </span>
        </div>
      )}

      {/* HIGHLIGHTS */}
      <div className="hsf-field">
        <label htmlFor="hsf-highlight">
          Points forts ({fields.highlights.length}/3)
        </label>
        <div className="hsf-highlight-input">
          <input
            id="hsf-highlight"
            type="text"
            value={highlightDraft}
            onChange={(e) => setHighlightDraft(e.target.value)}
            onKeyDown={handleHighlightKeyDown}
            placeholder="Livraison gratuite"
            disabled={fields.highlights.length >= 3}
            maxLength={40}
          />
          <button
            type="button"
            className="hsf-highlight-add-btn"
            onClick={addHighlight}
            disabled={fields.highlights.length >= 3}
          >
            <FaPlus />
          </button>
        </div>

        {fields.highlights.length > 0 && (
          <ul className="hsf-highlight-list">
            {fields.highlights.map((h, index) => (
              <li key={h + index}>
                <span>{h}</span>
                <button type="button" onClick={() => removeHighlight(index)}>
                  <FaTimes />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CTA */}
      <div className="hsf-row">
        <div className="hsf-field">
          <label htmlFor="hsf-ctaText">Texte du bouton</label>
          <input
            id="hsf-ctaText"
            type="text"
            value={fields.ctaText}
            onChange={(e) => setField("ctaText", e.target.value)}
            placeholder="Découvrir"
            maxLength={30}
          />
        </div>

        <div className="hsf-field">
          <label htmlFor="hsf-ctaLink">Lien du bouton</label>
          <input
            id="hsf-ctaLink"
            type="text"
            value={fields.ctaLink}
            onChange={(e) => setField("ctaLink", e.target.value)}
            placeholder="/categorie/promos"
          />
        </div>
      </div>
      <p className="hsf-hint">
        Laisse le lien vide pour ne pas afficher de bouton sur ce slide.
      </p>

      {/* DIFFUSION */}
      <div className="hsf-row">
        <div className="hsf-field">
          <label htmlFor="hsf-startDate">Début (optionnel)</label>
          <input
            id="hsf-startDate"
            type="date"
            value={fields.startDate}
            onChange={(e) => setField("startDate", e.target.value)}
          />
        </div>

        <div className="hsf-field">
          <label htmlFor="hsf-endDate">Fin (optionnel)</label>
          <input
            id="hsf-endDate"
            type="date"
            value={fields.endDate}
            onChange={(e) => setField("endDate", e.target.value)}
          />
        </div>
      </div>

      <div className="hsf-row">
        <div className="hsf-field">
          <label htmlFor="hsf-order">Ordre d'affichage</label>
          <input
            id="hsf-order"
            type="number"
            value={fields.order}
            onChange={(e) => setField("order", e.target.value)}
          />
        </div>

        <div className="hsf-field hsf-toggle-field">
          <label htmlFor="hsf-isActive">Actif</label>
          <label className="hsf-switch">
            <input
              id="hsf-isActive"
              type="checkbox"
              checked={fields.isActive}
              onChange={(e) => setField("isActive", e.target.checked)}
            />
            <span className="hsf-switch-slider" />
          </label>
        </div>
      </div>

      <button type="submit" className="hsf-publish-btn" disabled={loading}>
        {loading ? <CircularProgress /> : submitLabel}
      </button>
    </form>
  );
};

export default HomeSlideForm;