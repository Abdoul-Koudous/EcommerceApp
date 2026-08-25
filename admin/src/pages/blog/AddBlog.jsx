import React, { useEffect, useState, useContext } from "react";
import { FaCloudUploadAlt, FaTimes } from "react-icons/fa";
import "./blogform.scss";
import { postData, fetchDataFromApi, uploadImages } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import BlockEditor, { validateBlocks, prepareBlocksForSubmit } from "./BlockEditor";

const AddBlog = ({ onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const { openToast } = useContext(ToastContext);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [categories, setCategories] = useState([]);

  const [coverFile, setCoverFile] = useState(null);
  const [blocks, setBlocks] = useState([]);

  const [formFields, setFormFields] = useState({
    title: "",
    excerpt: "",
    category: "",
    image: null, // preview locale
    featured: false,
    status: "draft",
    readTime: 1,
    date: new Date().toISOString().slice(0, 10),
    authorName: "",
    authorRole: "",
  });

  useEffect(() => {
    fetchDataFromApi("/api/blog/getCategories").then((res) => {
      if (!res?.error) setCategories(res.categories || []);
    });
  }, []);

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCoverFile(file);
    setFormFields((prev) => ({ ...prev, image: URL.createObjectURL(file) }));
    e.target.value = "";
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formFields.title.trim())
      return openToast("error", "Le titre est obligatoire");
    if (!formFields.category.trim())
      return openToast("error", "La catégorie est obligatoire");
    if (!coverFile)
      return openToast("error", "Veuillez ajouter une image de couverture");
    if (Number(formFields.readTime) <= 0)
      return openToast("error", "Le temps de lecture doit être supérieur à 0");

    const blocksError = validateBlocks(blocks);
    if (blocksError) return openToast("error", blocksError);

    try {
      setLoadingSubmit(true);

      const coverForm = new FormData();
      coverForm.append("images", coverFile);
      const coverRes = await uploadImages("/api/blog/uploadImages", coverForm);

      if (!coverRes || coverRes.error || !coverRes.images?.length) {
        throw new Error(coverRes?.message || "Erreur upload de la couverture");
      }

      const body = await prepareBlocksForSubmit(blocks);

      const payload = {
        title: formFields.title.trim(),
        excerpt: formFields.excerpt.trim(),
        category: formFields.category.trim(),
        image: coverRes.images[0],
        featured: formFields.featured,
        status: formFields.status,
        readTime: Number(formFields.readTime),
        date: formFields.date,
        author: {
          name: formFields.authorName.trim(),
          role: formFields.authorRole.trim(),
        },
        body,
      };

      const res = await postData("/api/blog/add", payload);

      if (!res?.success) {
        throw new Error(res?.message || "Erreur ajout article");
      }

      openToast("success", "Article créé");
      setTimeout(handleClose, 500);
    } catch (error) {
      console.error(error);
      openToast("error", error.message || "Erreur serveur");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="blf-overlay">
      <div className={`blf-content ${isClosing ? "closing" : "opening"}`}>
        <div className="blf-header">
          <button className="blf-close-btn" onClick={handleClose}>
            <FaTimes />
          </button>
          <h2>Nouvel article</h2>
        </div>

        <div className="blf-body">
          <form onSubmit={handleSubmit} className="blf-form">
            <div className="blf-form-group">
              <label>Titre</label>
              <input
                type="text"
                name="title"
                value={formFields.title}
                onChange={onChangeInput}
              />
            </div>

            <div className="blf-form-group">
              <label>Extrait</label>
              <textarea name="excerpt" value={formFields.excerpt} onChange={onChangeInput} />
            </div>

            <div className="blf-row">
              <div className="blf-form-group">
                <label>Catégorie</label>
                <input
                  type="text"
                  name="category"
                  list="blog-categories"
                  value={formFields.category}
                  onChange={onChangeInput}
                  placeholder="Existante ou nouvelle"
                />
                <datalist id="blog-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className="blf-form-group">
                <label>Temps de lecture (min)</label>
                <input
                  type="number"
                  name="readTime"
                  min="1"
                  value={formFields.readTime}
                  onChange={onChangeInput}
                />
              </div>

              <div className="blf-form-group">
                <label>Date de publication</label>
                <input type="date" name="date" value={formFields.date} onChange={onChangeInput} />
              </div>
            </div>

            <div className="blf-row">
              <div className="blf-form-group">
                <label>Nom de l'auteur</label>
                <input
                  type="text"
                  name="authorName"
                  value={formFields.authorName}
                  onChange={onChangeInput}
                />
              </div>

              <div className="blf-form-group">
                <label>Rôle de l'auteur</label>
                <input
                  type="text"
                  name="authorRole"
                  value={formFields.authorRole}
                  onChange={onChangeInput}
                />
              </div>
            </div>

            <div className="blf-row">
              <div className="blf-form-group blf-toggle">
                <label>Article à la une</label>
                <div
                  className={`blf-switch ${formFields.featured ? "active" : ""}`}
                  onClick={() =>
                    setFormFields((prev) => ({ ...prev, featured: !prev.featured }))
                  }
                >
                  <div className="blf-slider" />
                </div>
              </div>

              <div className="blf-form-group blf-toggle">
                <label>Publier immédiatement</label>
                <div
                  className={`blf-switch ${formFields.status === "published" ? "active" : ""}`}
                  onClick={() =>
                    setFormFields((prev) => ({
                      ...prev,
                      status: prev.status === "published" ? "draft" : "published",
                    }))
                  }
                >
                  <div className="blf-slider" />
                </div>
              </div>
            </div>

            <div className="blf-image-upload">
              <label>Couverture</label>
              <div
                className="blf-image-box"
                onClick={() => document.getElementById("cover-img").click()}
              >
                {formFields.image ? (
                  <img src={formFields.image} alt="" />
                ) : (
                  <>
                    <FaCloudUploadAlt />
                    <span>Ajouter une image</span>
                  </>
                )}
              </div>
              <input
                id="cover-img"
                type="file"
                hidden
                accept="image/*"
                onChange={handleCoverChange}
              />
            </div>

            <BlockEditor blocks={blocks} onChange={setBlocks} />

            <button type="submit" className="blf-publish-btn" disabled={loadingSubmit}>
              {loadingSubmit ? <CircularProgress /> : "Publier"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBlog;