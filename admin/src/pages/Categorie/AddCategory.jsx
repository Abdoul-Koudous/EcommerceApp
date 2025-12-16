import React, { useEffect, useState, useContext } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import "./addCategory.scss";
import { deleteImages, postData, uploadImages } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const AddCategory = ({ onClose, onAddCategory }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { openToast } = useContext(ToastContext);
  const [loading, setLoading] = useState(false);

  const [formFields, setFormFields] = useState({
    name: "",
    images: [],
  });

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setPreviewsFun = (previewsArr) => {
    setPreviews(previewsArr);
    setFormFields((prev) => ({
      ...prev,
      images: previewsArr,
    }));
  };

  const removeImage = async (imgUrl, index) => {
    try {
      const res = await deleteImages(
        `/api/category/deleteImage?img=${encodeURIComponent(imgUrl)}`
      );

      if (res?.error) {
        return openToast("error", res.message);
      }

      setPreviews((prev) => prev.filter((_, i) => i !== index));

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

      const res = await uploadImages("/api/category/uploadImages", formData);
      setUploading(false);

      if (res?.error) {
        return openToast("error", res.message);
      }

      // 👉 On stocke uniquement les URLs
      setPreviews((prev) => [...prev, ...res.images]);

      openToast("success", "Images uploadées");
      e.target.value = "";
    } catch (err) {
      setUploading(false);
      openToast("error", "Erreur upload");
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 400);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (formFields.name.trim() === "") {
      openToast("error", "Le nom de la catégorie est requis");
      setLoading(false);
      return;
    }

    if (previews.length === 0) {
      openToast("error", "Au moins une image est requise");
      setLoading(false);
      return;
    }

    try {
      const res = await postData("/api/category/create", formFields);
      setLoading(false);

      if (res.success) {
        openToast("success", res.message || "Catégorie créée avec succès");

        // 🔹 Mettre à jour la liste du parent
        if (typeof onAddCategory === "function" && res.category) {
          onAddCategory(res.category);
        }

        setTimeout(() => {
          handleClose();
        }, 500);
      } else {
        openToast("error", res.message || "Erreur lors de la création de la catégorie");
      }
    } catch (err) {
      setLoading(false);
      openToast("error", err.message || "Erreur réseau");
    }
  };

  return (
    <div className="fullscreen-dialog">
      <div className={`dialog-content ${isClosing ? "closing" : "opening"}`}>
        {/* HEADER */}
        <div className="dialog-header">
          <div className="header-left">
            <button className="close-btn" onClick={handleClose}>
              <FaTimes />
            </button>
            <h2>Ajouter une catégorie</h2>
          </div>
        </div>

        {/* BODY */}
        <div className="dialog-body">
          <form className="category-form" onSubmit={handleSubmit}>
            {/* NOM */}
            <input
              type="text"
              placeholder="Nom de la catégorie"
              value={formFields.name}
              onChange={onChangeInput}
              name="name"
            />

            {/* IMAGES */}
            <div className="images-wrapper">
              {previews.map((img, index) => (
                <div className="image-circle" key={index}>
                  <img src={img} alt="cat" />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeImage(img, index)}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}

              <label className={`image-circle add ${uploading ? "disabled" : ""}`}>
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

            <button type="submit" className="publish-btn" disabled={loading}>
              {loading ? <CircularProgress /> : " Publier"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCategory;
