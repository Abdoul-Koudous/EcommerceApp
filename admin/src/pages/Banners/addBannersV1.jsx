import React, { useEffect, useState, useContext, useMemo } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import "./addBannersV1.scss";
import { deleteImages, postData, uploadImages, fetchDataFromApi } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const AddBannersV1 = ({ onClose, onAddBanner }) => {
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

  // 🔹 INPUT CHANGE
  const onChangeInput = e => {
  const { name, value } = e.target;

  setFormFields(prev => {
    if (name === "catId") {
      return {
        ...prev,
        catId: value,
        subCatId: "",
        thirdsubCatId: "",
      };
    }

    if (name === "subCatId") {
      return {
        ...prev,
        subCatId: value,
        thirdsubCatId: "",
      };
    }

    return { ...prev, [name]: value };
  });
};

  // 🔹 SYNC IMAGES
  const setPreviewsFun = arr => {
    setPreviews(arr);
    setFormFields(prev => ({ ...prev, images: arr }));
  };

  // 🔹 REMOVE IMAGE
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

  // 🔹 UPLOAD IMAGE
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

  // 🔹 CLOSE
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  // 🔹 FETCH CATEGORIES
  useEffect(() => {
    if (!categories || categories.length === 0) {
      fetchDataFromApi("/api/category").then(res => {
        if (res?.data) setCategories(res.data);
      });
    }
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, [categories, setCategories]);

  // 🔹 SUBMIT
  const handleSubmit = async e => {
    e.preventDefault();
    if (!formFields.bannerTitle.trim()) return openToast("error", "Titre requis");
    if (!previews.length) return openToast("error", "Au moins une image requise");
    if (!formFields.catId) return openToast("error", "Catégorie requise");
    if (!formFields.price) return openToast("error", "Prix requis");
    if (!formFields.alignInfo) return openToast("error", "Alignement requis");
    

    try {
      setLoading(true);
      const selectedCategory = categories.find(cat => cat._id === formFields.catId);
      const payload = {
        ...formFields,
        categoryName: selectedCategory?.name || "",
        };
      const res = await postData("/api/bannerV1/create", payload);
      setLoading(false);

      if (res.success) {
        openToast("success", "Bannière créée");
        if (onAddBanner && res.banner) onAddBanner(res.banner);
        setTimeout(handleClose, 500);
      } else openToast("error", res.message);
    } catch {
      setLoading(false);
      openToast("error", "Erreur serveur");
    }
  };

  return (
    <div className="fullscreen-dialog">
      <div className={`dialog-content ${isClosing ? "closing" : "opening"}`}>
        <div className="dialog-header">
          <div className="header-left">
            <button className="close-btn" onClick={handleClose}><FaTimes /></button>
            <h2>Ajouter une bannière</h2>
          </div>
        </div>

        <div className="dialog-body">
          <form className="category-form" onSubmit={handleSubmit}>
            <div className="form-row">
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

            <div className="form-row">
              <select value={formFields.catId} onChange={onChangeInput} name="catId">
                <option value="">Choisir catégorie</option>
                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
              <select value={formFields.subCatId} onChange={onChangeInput} name="subCatId" disabled={!subCategories.length}>
                <option value="">Sous-catégorie</option>
                {subCategories.map(sub => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
              </select>
            </div>

            <div className="form-row">
                <select value={formFields.thirdsubCatId} onChange={onChangeInput} name="thirdsubCatId" disabled={!thirdSubCategories.length}>
                <option value="">3ème sous-catégorie</option>
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
            <div className="images-wrapper">
              {previews.map((img, index) => (
                <div className="image-circle" key={index}>
                  <img src={img} alt="banner" />
                  <button type="button" className="remove-btn" onClick={() => removeImage(img, index)}><FaTimes /></button>
                </div>
              ))}

              <label className={`image-circle add ${uploading ? "disabled" : ""}`}>
                {uploading ? <CircularProgress size={28} /> : <FaPlus />}
                <input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={onChangeFile} />
              </label>
            </div>

            <button className="publish-btn" disabled={loading}>
              {loading ? <CircularProgress /> : "Publier"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBannersV1;