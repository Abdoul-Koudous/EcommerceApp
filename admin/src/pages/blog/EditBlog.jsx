import React, { useEffect, useState, useContext } from "react";
import { FaCloudUploadAlt, FaTimes } from "react-icons/fa";
import "./blogform.scss";
import { editData, uploadImages, fetchDataFromApi } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import BlockEditor, { validateBlocks, prepareBlocksForSubmit } from "./BlockEditor";

let uid = 0;
const withKeys = (body) =>
  (body || []).map((b) => ({
    _key: `blk-${Date.now()}-${uid++}`,
    _file: null,
    type: b.type,
    text: b.text || "",
    author: b.author || "",
    src: b.src || "",
    caption: b.caption || "",
    items: b.items && b.items.length ? b.items : b.type === "list" ? [""] : [],
  }));

const EditBlog = ({ blog, onClose }) => {
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
    image: null,
    featured: false,
    status: "draft",
    readTime: 1,
    date: "",
    authorName: "",
    authorRole: "",
  });

  useEffect(() => {
    fetchDataFromApi("/api/blog/getCategories").then((res) => {
      if (!res?.error) setCategories(res.categories || []);
    });
  }, []);

  useEffect(() => {
    if (!blog) return;

    setFormFields({
      title: blog.title || "",
      excerpt: blog.excerpt || "",
      category: blog.category || "",
      image: blog.image || null,
      featured: blog.featured || false,
      status: blog.status || "draft",
      readTime: blog.readTime || 1,
      date: blog.date ? new Date(blog.date).toISOString().slice(0, 10) : "",
      authorName: blog.author?.name || "",
      authorRole: blog.author?.role || "",
    });

    setBlocks(withKeys(blog.body));
  }, [blog]);

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
    if (!formFields.image && !coverFile)
      return openToast("error", "Veuillez ajouter une image de couverture");
    if (Number(formFields.readTime) <= 0)
      return openToast("error", "Le temps de lecture doit être supérieur à 0");

    const blocksError = validateBlocks(blocks);
    if (blocksError) return openToast("error", blocksError);

    try {
      setLoadingSubmit(true);

      let imageUrl = formFields.image;

      if (coverFile) {
        const coverForm = new FormData();
        coverForm.append("images", coverFile);
        const coverRes = await uploadImages("/api/blog/uploadImages", coverForm);

        if (!coverRes || coverRes.error || !coverRes.images?.length) {
          throw new Error(coverRes?.message || "Erreur upload de la couverture");
        }

        imageUrl = coverRes.images[0];
      }

      const body = await prepareBlocksForSubmit(blocks);

      const payload = {
        title: formFields.title.trim(),
        excerpt: formFields.excerpt.trim(),
        category: formFields.category.trim(),
        image: imageUrl,
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

      const res = await editData(`/api/blog/update/${blog._id}`, payload);

      if (!res?.success) {
        throw new Error(res?.message || "Erreur mise à jour");
      }

      openToast("success", "Article mis à jour");
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
          <h2>Modifier l'article</h2>
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
                  list="blog-categories-edit"
                  value={formFields.category}
                  onChange={onChangeInput}
                />
                <datalist id="blog-categories-edit">
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
                <label>Publié</label>
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
                onClick={() => document.getElementById("cover-img-edit").click()}
              >
                {formFields.image ? <img src={formFields.image} alt="" /> : <FaCloudUploadAlt />}
              </div>
              <input
                id="cover-img-edit"
                type="file"
                hidden
                accept="image/*"
                onChange={handleCoverChange}
              />
            </div>

            <BlockEditor blocks={blocks} onChange={setBlocks} />

            <button type="submit" className="blf-publish-btn" disabled={loadingSubmit}>
              {loadingSubmit ? <CircularProgress /> : "Mettre à jour"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBlog;