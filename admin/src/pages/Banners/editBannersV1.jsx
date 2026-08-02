import React, { useEffect, useState, useContext, useMemo } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import "./addBannersV1.scss";
import { deleteImages, editData, uploadImages, fetchDataFromApi } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const EditBannersV1 = ({ banner, onClose, onUpdateBanner }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { openToast } = useContext(ToastContext);

  const [categories, setCategories] = useState([]);
  const [formFields, setFormFields] = useState({
    bannerTitle: "",
    images: [],
    catId: "",
    subCatId: "",
    thirdsubCatId: "",
    price: "",
    alignInfo: "left",
  });

  const subCategories = useMemo(() => {
    const selectedCat = categories.find(cat => cat._id === formFields.catId);
    return selectedCat?.children || [];
  }, [categories, formFields.catId]);

  const thirdSubCategories = useMemo(() => {
    const selectedSub = subCategories.find(sub => sub._id === formFields.subCatId);
    return selectedSub?.children || [];
  }, [subCategories, formFields.subCatId]);

  useEffect(() => {
    if (banner) {
      setFormFields({
        bannerTitle: banner.bannerTitle || "",
        price: banner.price || "",
        images: banner.images || [],
        catId: banner.catId || "",
        subCatId: banner.subCatId || "",
        thirdsubCatId: banner.thirdsubCatId || "",
        alignInfo: banner.alignInfo || "left",
      });
      setPreviews(banner.images || []);
    }
  }, [banner]);

  useEffect(() => {
    fetchDataFromApi("/api/category").then(res => {
      if (res?.data) setCategories(res.data);
    });
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  const onChangeInput = e => {
    const { name, value } = e.target;
    setFormFields(prev => ({ ...prev, [name]: value }));
  };

  const setPreviewsFun = arr => {
    setPreviews(arr);
    setFormFields(prev => ({ ...prev, images: arr }));
  };

  const removeImage = async (imgUrl, index) => {
    try {
      const res = await deleteImages(`/api/bannerV1/deleteImage?img=${encodeURIComponent(imgUrl)}`);
      if (res?.error) return openToast("error", res.message);
      setPreviewsFun(previews.filter((_, i) => i !== index));
      openToast("success", res?.message || "Image supprimée");
    } catch {
      openToast("error", "Erreur suppression image");
    }
  };

  const onChangeFile = async e => {
    const files = Array.from(e.target.files);
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

    const res = await uploadImages("/api/bannerV1/uploadImages", formData);
    setUploading(false);
    if (res?.error) return openToast("error", res.message);

    setPreviewsFun([...previews, ...res.images]);
    openToast("success", "Images uploadées");
    e.target.value = "";
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formFields.bannerTitle.trim()) return openToast("error", "Titre requis");
    if (!previews.length) return openToast("error", "Au moins une image requise");

    try {
      setLoading(true);
      const res = await editData(`/api/bannerV1/${banner._id}`, formFields);
      setLoading(false);

      if (res.success) {
        openToast("success", "Bannière modifiée");
        if (onUpdateBanner) onUpdateBanner();
        setTimeout(handleClose, 500);
      } else openToast("error", res.message);
    } catch {
      setLoading(false);
      openToast("error", "Erreur serveur");
    }
  };

  return (
    <div className="bnf-overlay">
      <div className={`bnf-content ${isClosing ? "closing" : "opening"}`}>
        <div className="bnf-header">
          <div className="bnf-header-left">
            <button className="bnf-close-btn" onClick={handleClose}><FaTimes /></button>
            <h2>Modifier la bannière</h2>
          </div>
        </div>

        <div className="bnf-body">
          <form className="bnf-form" onSubmit={handleSubmit}>
            <div className="bnf-form-row">
              <input
                type="text"
                name="bannerTitle"
                placeholder="Titre bannière"
                value={formFields.bannerTitle}
                onChange={onChangeInput}
              />
              <input
                type="number"
                name="price"
                placeholder="Prix"
                value={formFields.price}
                onChange={onChangeInput}
              />
            </div>

            <div className="bnf-form-row">
              <select value={formFields.catId} onChange={onChangeInput} name="catId">
                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
              <select value={formFields.subCatId} onChange={onChangeInput} name="subCatId" disabled={!subCategories.length}>
                {subCategories.map(sub => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
              </select>
            </div>

            <div className="bnf-form-row">
              <select value={formFields.thirdsubCatId} onChange={onChangeInput} name="thirdsubCatId" disabled={!thirdSubCategories.length}>
                {thirdSubCategories.map(third => <option key={third._id} value={third._id}>{third.name}</option>)}
              </select>
              <select
                name="alignInfo"
                value={formFields.alignInfo}
                onChange={onChangeInput}
              >
                <option value="left">Texte à gauche</option>
                <option value="right">Texte à droite</option>
              </select>
            </div>

            {/* IMAGES */}
            <div className="bnf-images-wrapper">
              {previews.map((img, index) => (
                <div className="bnf-image-circle" key={index}>
                  <img src={img} alt="banner" />
                  <button type="button" className="bnf-remove-btn" onClick={() => removeImage(img, index)}><FaTimes /></button>
                </div>
              ))}

              <label className={`bnf-image-circle bnf-add ${uploading ? "bnf-disabled" : ""}`}>
                {uploading ? <CircularProgress size={28} /> : <FaPlus />}
                <input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={onChangeFile} />
              </label>
            </div>

            <button className="bnf-publish-btn" disabled={loading}>
              {loading ? <CircularProgress /> : "Mettre à jour"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBannersV1;