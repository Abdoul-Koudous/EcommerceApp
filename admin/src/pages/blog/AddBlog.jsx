import React, { useEffect, useState, useContext } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import "./addBlog.scss";

import {
  deleteImages,
  postData,
  uploadImages,
} from "../utils/api";

import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

import Editor from "react-simple-wysiwyg";

const AddBlog = ({ onClose, onAddBlog }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const { openToast } = useContext(ToastContext);

  const [formFields, setFormFields] = useState({
    title: "",
    description: "",
    images: [],
  });

  // 🔹 INPUT TITLE
  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 🔹 SYNC IMAGES
  const setPreviewsFun = (arr) => {
    setPreviews(arr);
    setFormFields((prev) => ({
      ...prev,
      images: arr,
    }));
  };

  // 🔹 REMOVE IMAGE
  const removeImage = async (imgUrl, index) => {
    try {
      const res = await deleteImages(
        `/api/blog/deleteImage?img=${encodeURIComponent(imgUrl)}`
      );

      if (res?.error) return openToast("error", res.message);

      const updated = previews.filter((_, i) => i !== index);
      setPreviewsFun(updated);

      openToast("success", res?.message || "Image supprimée");
    } catch {
      openToast("error", "Erreur suppression image");
    }
  };

  // 🔹 UPLOAD IMAGE
  const onChangeFile = async (e) => {
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

    const res = await uploadImages("/api/blog/uploadImages", formData);

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

  // 🔹 SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formFields.title.trim())
      return openToast("error", "Titre requis");

    if (!formFields.description.trim())
      return openToast("error", "Description requise");

    if (!previews.length)
      return openToast("error", "Au moins une image requise");

    try {
      setLoading(true);

      const payload = {
        ...formFields,
        images: previews,
      };

      const res = await postData("/api/blog/create", payload);

      setLoading(false);

      if (res.success) {
        openToast("success", "Blog créé");

        if (onAddBlog && res.blog) {
          onAddBlog(res.blog);
        }

        setTimeout(handleClose, 500);
      } else {
        openToast("error", res.message);
      }
    } catch {
      setLoading(false);
      openToast("error", "Erreur serveur");
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  return (
    <div className="fullscreen-dialog">
      <div className={`dialog-content ${isClosing ? "closing" : "opening"}`}>
        
        {/* HEADER */}
        <div className="dialog-header">
          <div className="header-left">
            <button className="close-btn" onClick={handleClose}>
              <FaTimes />
            </button>
            <h2>Ajouter un blog</h2>
          </div>
        </div>

        {/* BODY */}
        <div className="dialog-body">
          <form className="category-form" onSubmit={handleSubmit}>
            
            {/* TITLE */}
            <div className="form-row">
              <input
                type="text"
                name="title"
                placeholder="Titre du blog"
                value={formFields.title}
                onChange={onChangeInput}
              />
            </div>

            {/* 🔥 WYSIWYG */}
            <div className="form-row wysiwyg-wrapper">
              <Editor
                containerProps={{
                  style: {
                    resize: "vertical",
                    overflow: "auto",
                  },
                }}
                value={formFields.description}
                onChange={(e) =>
                  setFormFields((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            {/* IMAGES */}
            <div className="images-wrapper">
              {previews.map((img, index) => (
                <div className="image-circle" key={index}>
                  <img src={img} alt="blog" />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeImage(img, index)}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}

              <label
                className={`image-circle add ${
                  uploading ? "disabled" : ""
                }`}
              >
                {uploading ? (
                  <CircularProgress size={28} />
                ) : (
                  <FaPlus />
                )}

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

            {/* SUBMIT */}
            <button className="publish-btn" disabled={loading}>
              {loading ? <CircularProgress /> : "Publier"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBlog;