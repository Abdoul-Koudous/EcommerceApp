import React, { useEffect, useState, useContext } from "react";
import { FaTimes } from "react-icons/fa";
import "./addSubCategory.scss";
import { fetchDataFromApi, postData } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const AddSubCategory = ({ onClose, onAddCategory }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingCat, setLoadingCat] = useState(false);
  const [loadingSub, setLoadingSub] = useState(false);
  const { openToast } = useContext(ToastContext);

  const [formCat, setFormCat] = useState({ name: "", parentId: "", parentCatName: "" });
  const [formSub, setFormSub] = useState({ name: "", parentId: "", parentCatName: "" });

  // Charger catégories et sous-catégories
  useEffect(() => {
    fetchDataFromApi("/api/category").then((res) => {
      const cats = res?.data || [];
      setCategories(cats);
      setSubCategories(cats.flatMap((c) => c.children || []));
    });

    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 400);
  };

  // Bloc 1 : changement catégorie parente
  const onChangeCategory = (e) => {
    const parentId = e.target.value;
    const parent = categories.find((cat) => cat._id === parentId);
    setFormCat({
      ...formCat,
      parentId: parent?._id || "",
      parentCatName: parent?.name || "",
    });

    // Réinitialiser le bloc 2
    setFormSub({ name: "", parentId: "", parentCatName: "" });
  };

  // Bloc 2 : changement sous-catégorie parente
  const onChangeSubCategory = (e) => {
    const parentId = e.target.value;
    const parent = subCategories.find((sub) => sub._id === parentId);
    setFormSub({
      ...formSub,
      parentId: parent?._id || "",
      parentCatName: parent?.name || "",
    });
  };

  const onChangeInput = (formSetter) => (e) => {
    const { name, value } = e.target;
    formSetter((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (form, resetForm, setLoading) => {
    if (!form.parentId) return openToast("error", "Veuillez sélectionner un parent");
    if (!form.name.trim()) return openToast("error", "Nom requis");

    try {
      setLoading(true);
      const res = await postData("/api/category/create", form);
      setLoading(false);

      if (res?.success) {
        openToast("success", res.message || "Création réussie");
        resetForm({ name: "", parentId: "", parentCatName: "" });

        // 🔹 Mise à jour directe de la liste dans le parent
        if (typeof onAddCategory === "function" && res.category) {
          onAddCategory(res.category);
        }

        setTimeout(() => handleClose(), 500);
      } else {
        openToast("error", res?.message || "Erreur création");
      }
    } catch (err) {
      setLoading(false);
      openToast("error", "Erreur serveur");
    }
  };

  return (
    <div className="fullscreen-dialog">
      <div className={`dialog-content ${isClosing ? "closing" : "opening"}`}>
        <div className="dialog-header">
          <div className="header-left">
            <button className="close-btn" onClick={handleClose}>
              <FaTimes />
            </button>
            <h2>Ajouter une sous-catégorie</h2>
          </div>
        </div>

        <div className="dialog-body">
          <form className="subcategory-form">
            {/* Bloc 1 */}
            <div className="left">
              <h4>Catégorie parente</h4>
              <select value={formCat.parentId} onChange={onChangeCategory}>
                <option value="">-- Sélectionner une catégorie --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <h4>Nom de la sous-catégorie</h4>
              <input
                type="text"
                name="name"
                placeholder="Ex: Sneakers"
                value={formCat.name}
                onChange={onChangeInput(setFormCat)}
              />

              <button
                type="button"
                className="publish-btn"
                onClick={() => handleSubmit(formCat, setFormCat, setLoadingCat)}
                disabled={loadingCat}
              >
                {loadingCat ? <CircularProgress /> : "Publier"}
              </button>
            </div>

            {/* Bloc 2 */}
            <div className="right">
              <h4>Sous-catégorie parente</h4>
              <select value={formSub.parentId} onChange={onChangeSubCategory}>
                <option value="">-- Sélectionner une sous-catégorie --</option>
                {subCategories
                  .filter((sub) => sub.parentId === formCat.parentId)
                  .map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
              </select>

              <h4>Nom de la sous-sous-catégorie</h4>
              <input
                type="text"
                name="name"
                placeholder="Ex: Air Max"
                value={formSub.name}
                onChange={onChangeInput(setFormSub)}
              />

              <button
                type="button"
                className="publish-btn"
                onClick={() => handleSubmit(formSub, setFormSub, setLoadingSub)}
                disabled={loadingSub}
              >
                {loadingSub ? <CircularProgress /> : "Publier"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSubCategory;
