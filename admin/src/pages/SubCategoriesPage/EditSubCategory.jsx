import React, { useEffect, useState, useContext } from "react";
import { FaTimes } from "react-icons/fa";
import "./addSubCategory.scss";
import { fetchDataFromApi, editData } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const EditSubCategory = ({ subCategory, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { openToast } = useContext(ToastContext);

  const [formFields, setFormFields] = useState({
    name: "",
    category: "",
  });

  // 🔹 Init data
  useEffect(() => {
    fetchDataFromApi("/api/category").then((res) => {
      setCategories(res?.data || []);
    });

    if (subCategory) {
      setFormFields({
        name: subCategory.name || "",
        category: subCategory.category?._id || subCategory.category,
      });
    }

    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, [subCategory]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 400);
  };

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formFields.category) {
      return openToast("error", "Veuillez sélectionner une catégorie");
    }

    if (!formFields.name.trim()) {
      return openToast("error", "Nom de la sous-catégorie requis");
    }

    try {
      setLoading(true);
      const res = await editData(
        `/api/subcategory/${subCategory._id}`,
        formFields
      );
      setLoading(false);

      if (res?.success) {
        openToast("success", res.message || "Sous-catégorie modifiée");
        setTimeout(handleClose, 500);
      } else {
        openToast("error", res?.message || "Erreur modification");
      }
    } catch (err) {
      setLoading(false);
      openToast("error", "Erreur serveur");
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
            <h2>Modifier la sous-catégorie</h2>
          </div>
        </div>

        {/* BODY */}
        <div className="dialog-body">
          <form className="subcategory-form" onSubmit={handleSubmit}>
            {/* LEFT : PARENT CATEGORY */}
            <div className="left">
              <h4>Catégorie parente</h4>
              <ul className="category-list">
                {categories.map((cat) => (
                  <li
                    key={cat._id}
                    className={
                      formFields.category === cat._id ? "active" : ""
                    }
                    onClick={() =>
                      setFormFields((prev) => ({
                        ...prev,
                        category: cat._id,
                      }))
                    }
                  >
                    {cat.name}
                  </li>
                ))}
              </ul>
            </div>

            {/* RIGHT : SUBCATEGORY */}
            <div className="right">
              <h4>Nom de la sous-catégorie</h4>
              <input
                type="text"
                name="name"
                value={formFields.name}
                onChange={onChangeInput}
                placeholder="Nom de la sous-catégorie"
              />

              <button type="submit" className="publish-btn" disabled={loading}>
                {loading ? <CircularProgress /> : "Mettre à jour"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSubCategory;
