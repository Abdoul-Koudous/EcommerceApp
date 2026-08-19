import React, { useState, useEffect, useContext } from "react";
import { fetchDataFromApi, editData, uploadImages } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import { FaSave } from "react-icons/fa";
import AboutForm from "./AboutPage";
import AboutPreview from "../../components/AboutPreview/AboutPreview";
import "./aboutpage.scss";

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

        <AboutForm
          form={form}
          uploadingField={uploadingField}
          onChange={onChange}
          onImageUpload={handleImageUpload}
          onUpdateParagraph={updateParagraph}
          onAddParagraph={addParagraph}
          onRemoveParagraph={removeParagraph}
          onUpdateStat={updateStat}
          onAddStat={addStat}
          onRemoveStat={removeStat}
          onUpdateValue={updateValue}
          onAddValue={addValue}
          onRemoveValue={removeValue}
        />

        <button className="btn-save btn-save--bottom" onClick={handleSave} disabled={saving}>
          <FaSave /> {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>

      <div className="about-admin__preview-col">
        <div className="preview-sticky">
          <p className="preview-label">Aperçu en direct</p>
          <div className="preview-frame">
            <AboutPreview data={form} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;