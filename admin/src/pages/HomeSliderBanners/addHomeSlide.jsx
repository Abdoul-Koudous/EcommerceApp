import React, { useEffect, useState, useContext } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import "./addHomeSlide.scss";
import { deleteImages, postData, uploadImages } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const AddHomeSlide = ({ onClose, onAddSlide }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { openToast } = useContext(ToastContext);
  const [loading, setLoading] = useState(false);

  const setPreviewsFun = (previewsArr) => {
    setPreviews(previewsArr);
  };

  const removeImage = async (imgUrl, index) => {
    try {
      const res = await deleteImages(
        `/api/homeSlide/deleteImage?img=${encodeURIComponent(imgUrl)}`
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

      const res = await uploadImages("/api/homeSlide/uploadImages", formData);
      setUploading(false);

      if (res?.error) {
        return openToast("error", res.message);
      }

      // On stocke uniquement les URLs
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

    if (previews.length === 0) {
      openToast("error", "Au moins une image est requise");
      setLoading(false);
      return;
    }

    try {
      const res = await postData("/api/homeSlide/create", { images: previews });
      setLoading(false);

      if (res.success) {
        openToast("success", res.message || "Slide créé avec succès");

        if (typeof onAddSlide === "function" && res.slide) {
          onAddSlide(res.slide);
        }

        setTimeout(() => handleClose(), 500);
      } else {
        openToast("error", res.message || "Erreur lors de la création du slide");
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
            <h2>Ajouter un slide</h2>
          </div>
        </div>

        {/* BODY */}
        <div className="dialog-body">
          <form className="slide-form" onSubmit={handleSubmit}>
            {/* IMAGES */}
            <div className="images-wrapper">
              {previews.map((img, index) => (
                <div className="image-circle" key={index}>
                  <img src={img} alt="slide" />
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

export default AddHomeSlide;