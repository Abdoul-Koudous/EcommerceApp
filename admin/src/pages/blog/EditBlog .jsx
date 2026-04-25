import React, { useEffect, useState, useContext } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import "./addBlog.scss";

import {
  deleteImages,
  editData,
  uploadImages
} from "../utils/api";

import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

import Editor from "react-simple-wysiwyg";

const EditBlog = ({ blog, onClose }) => {
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

  // 🔥 LOAD DATA (comme category)
  useEffect(() => {
    if (blog) {
      setFormFields({
        title: blog.title || "",
        description: blog.description || "",
        images: blog.images || [],
      });

      setPreviews(blog.images || []);
    }
  }, [blog]);

  // INPUT
  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // SYNC IMAGES
  const setPreviewsFun = (arr) => {
    setPreviews(arr);
    setFormFields((prev) => ({
      ...prev,
      images: arr,
    }));
  };

  // DELETE IMAGE
  const removeImage = async (imgUrl, index) => {
    try {
      const res = await deleteImages(
        `/api/blog/deleteImage?img=${encodeURIComponent(imgUrl)}`
      );

      if (res?.error) return openToast("error", res.message);

      const updated = previews.filter((_, i) => i !== index);
      setPreviewsFun(updated);

      openToast("success", "Image supprimée");
    } catch {
      openToast("error", "Erreur suppression image");
    }
  };

  // UPLOAD IMAGE
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

      const res = await uploadImages("/api/blog/uploadImages", formData);

      setUploading(false);

      if (res?.error) return openToast("error", res.message);

      setPreviewsFun([...previews, ...res.images]);

      openToast("success", "Images uploadées");
      e.target.value = "";

    } catch {
      setUploading(false);
      openToast("error", "Erreur upload");
    }
  };

  // CLOSE
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 400);
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formFields.title.trim()) {
      openToast("error", "Titre requis");
      setLoading(false);
      return;
    }

    if (!formFields.description.trim()) {
      openToast("error", "Description requise");
      setLoading(false);
      return;
    }

    if (previews.length === 0) {
      openToast("error", "Au moins une image requise");
      setLoading(false);
      return;
    }

    try {
      const res = await editData(`/api/blog/${blog._id}`, formFields);

      setLoading(false);

      if (res.success) {
        openToast("success", "Blog modifié");
        setTimeout(() => handleClose(), 500);
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
            <h2>Modifier le blog</h2>
          </div>
        </div>

        {/* BODY */}
        <div className="dialog-body">
          <form className="category-form" onSubmit={handleSubmit}>

            {/* TITLE */}
            <input
              type="text"
              name="title"
              placeholder="Titre du blog"
              value={formFields.title}
              onChange={onChangeInput}
            />

            {/* DESCRIPTION */}
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

              <label className={`image-circle add ${uploading ? "disabled" : ""}`}>
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
            <button type="submit" className="publish-btn" disabled={loading}>
              {loading ? <CircularProgress /> : "Mettre à jour"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBlog;