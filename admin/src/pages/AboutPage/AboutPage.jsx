import React, { useState, useEffect, useContext } from "react";
import { fetchDataFromApi, editData, uploadImages } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import { FaTrash, FaPlus, FaSave } from "react-icons/fa";
import IconPicker from "../../components/IconPicker/IconPicker";
import "./aboutpage.scss";
import AboutPreview from "../../components/AboutPreview/AboutPreview";
import LivePreviewFrame from "../../components/LivePreviewFrame/LivePreviewFrame";

const AboutPage = () => {
  const { openToast } = useContext(ToastContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);

  const [form, setForm] = useState({
    heroTag: "",
    heroTitle: "",
    heroSubtitle: "",
    heroImage: "",
    storyTag: "",
    storyTitle: "",
    storyParagraphs: [],
    storyImage: "",
    stats: [],
    valuesTag: "",
    valuesTitle: "",
    values: [],
    ctaTitle: "",
    ctaSubtitle: "",
  });

  useEffect(() => {
    fetchDataFromApi("/api/about").then((res) => {
      if (res?.success) {
        setForm((prev) => ({ ...prev, ...res.data }));
      }
      setLoading(false);
    });
  }, []);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("images", file);

    setUploadingField(field);

    uploadImages("/api/about/uploadImages", formData)
      .then((res) => {
        if (res?.success && res.images?.[0]) {
          setForm((prev) => ({ ...prev, [field]: res.images[0] }));
          openToast("success", "Image téléchargée");
        } else {
          openToast("error", "Échec du téléchargement");
        }
      })
      .catch(() => openToast("error", "Erreur réseau lors de l'upload"))
      .finally(() => setUploadingField(null));
  };

  const updateParagraph = (index, value) => {
    setForm((prev) => {
      const arr = [...prev.storyParagraphs];
      arr[index] = value;
      return { ...prev, storyParagraphs: arr };
    });
  };
  const addParagraph = () => {
    setForm((prev) => ({ ...prev, storyParagraphs: [...prev.storyParagraphs, ""] }));
  };
  const removeParagraph = (index) => {
    setForm((prev) => ({
      ...prev,
      storyParagraphs: prev.storyParagraphs.filter((_, i) => i !== index),
    }));
  };

  const updateStat = (index, key, value) => {
    setForm((prev) => {
      const arr = [...prev.stats];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, stats: arr };
    });
  };
  const addStat = () => {
    setForm((prev) => ({ ...prev, stats: [...prev.stats, { value: "", label: "" }] }));
  };
  const removeStat = (index) => {
    setForm((prev) => ({ ...prev, stats: prev.stats.filter((_, i) => i !== index) }));
  };

  const updateValue = (index, key, value) => {
    setForm((prev) => {
      const arr = [...prev.values];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, values: arr };
    });
  };
  const addValue = () => {
    setForm((prev) => ({
      ...prev,
      values: [...prev.values, { icon: "FaShippingFast", title: "", description: "" }],
    }));
  };
  const removeValue = (index) => {
    setForm((prev) => ({ ...prev, values: prev.values.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    setSaving(true);
    editData("/api/about", form)
      .then((res) => {
        if (res?.success) {
          openToast("success", "Page À propos mise à jour");
        } else {
          openToast("error", res?.message || "Erreur lors de la mise à jour");
        }
      })
      .catch(() => openToast("error", "Erreur serveur"))
      .finally(() => setSaving(false));
  };

  if (loading) return <div className="about-admin-loading">Chargement...</div>;

  return (
    <div className="about-admin about-admin--split">
      <div className="about-admin__form-col">
        <div className="about-admin__header">
          <h2>Page À propos</h2>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            <FaSave /> {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>

        <section className="admin-card">
          <h3>Section Hero</h3>
          <div className="form-group">
            <label>Tag (petit texte au-dessus du titre)</label>
            <input name="heroTag" value={form.heroTag} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Titre principal</label>
            <input name="heroTitle" value={form.heroTitle} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Sous-titre</label>
            <textarea name="heroSubtitle" rows="3" value={form.heroSubtitle} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Image de fond</label>
            {form.heroImage && <img src={form.heroImage} alt="hero" className="preview-img" />}
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "heroImage")} />
            {uploadingField === "heroImage" && <span className="uploading">Téléchargement...</span>}
          </div>
        </section>

        <section className="admin-card">
          <h3>Notre histoire</h3>
          <div className="form-group">
            <label>Tag</label>
            <input name="storyTag" value={form.storyTag} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Titre</label>
            <input name="storyTitle" value={form.storyTitle} onChange={onChange} />
          </div>

          <div className="form-group">
            <label>Paragraphes</label>
            {form.storyParagraphs.map((p, i) => (
              <div className="repeatable-row" key={i}>
                <textarea rows="3" value={p} onChange={(e) => updateParagraph(i, e.target.value)} />
                <button className="btn-remove" onClick={() => removeParagraph(i)}>
                  <FaTrash />
                </button>
              </div>
            ))}
            <button className="btn-add" onClick={addParagraph}>
              <FaPlus /> Ajouter un paragraphe
            </button>
          </div>

          <div className="form-group">
            <label>Image</label>
            {form.storyImage && <img src={form.storyImage} alt="story" className="preview-img" />}
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "storyImage")} />
            {uploadingField === "storyImage" && <span className="uploading">Téléchargement...</span>}
          </div>
        </section>

        <section className="admin-card">
          <h3>Statistiques</h3>
          {form.stats.map((stat, i) => (
            <div className="repeatable-row repeatable-row--double" key={i}>
              <input
                placeholder="Valeur (ex: 5+)"
                value={stat.value}
                onChange={(e) => updateStat(i, "value", e.target.value)}
              />
              <input
                placeholder="Libellé (ex: Années d'expérience)"
                value={stat.label}
                onChange={(e) => updateStat(i, "label", e.target.value)}
              />
              <button className="btn-remove" onClick={() => removeStat(i)}>
                <FaTrash />
              </button>
            </div>
          ))}
          <button className="btn-add" onClick={addStat}>
            <FaPlus /> Ajouter une statistique
          </button>
        </section>

        <section className="admin-card">
          <h3>Pourquoi nous choisir</h3>
          <div className="form-group">
            <label>Tag</label>
            <input name="valuesTag" value={form.valuesTag} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Titre</label>
            <input name="valuesTitle" value={form.valuesTitle} onChange={onChange} />
          </div>

          {form.values.map((val, i) => (
            <div className="value-card-editor" key={i}>
              <div className="form-row">
                <div className="form-group">
                  <label>Icône</label>
                  <IconPicker
                    value={val.icon}
                    onChange={(iconName) => updateValue(i, "icon", iconName)}
                  />
                </div>
                <div className="form-group">
                  <label>Titre</label>
                  <input value={val.title} onChange={(e) => updateValue(i, "title", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  value={val.description}
                  onChange={(e) => updateValue(i, "description", e.target.value)}
                />
              </div>
              <button className="btn-remove" onClick={() => removeValue(i)}>
                <FaTrash /> Supprimer cette carte
              </button>
            </div>
          ))}
          <button className="btn-add" onClick={addValue}>
            <FaPlus /> Ajouter une carte valeur
          </button>
        </section>

        <section className="admin-card">
          <h3>Appel à l'action (bas de page)</h3>
          <div className="form-group">
            <label>Titre</label>
            <input name="ctaTitle" value={form.ctaTitle} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Sous-titre</label>
            <textarea rows="2" name="ctaSubtitle" value={form.ctaSubtitle} onChange={onChange} />
          </div>
        </section>

        <button className="btn-save btn-save--bottom" onClick={handleSave} disabled={saving}>
          <FaSave /> {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>

            <div className="about-admin__preview-col">
        <div className="preview-sticky">
          <p className="preview-label">Aperçu en direct</p>
          <div className="preview-frame">
            <LivePreviewFrame>
              <AboutPreview data={form} />
            </LivePreviewFrame>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;