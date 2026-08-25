// 📁 Fichier à créer : admin/src/pages/help-faq/EditFaq.jsx

import React, { useEffect, useState, useContext } from "react";
import { FaTimes } from "react-icons/fa";
import "./helpfaqform.scss";
import { editData, fetchDataFromApi } from "../utils/api";
import IconPicker from "../../components/IconPicker/IconPicker";
import { ToastContext } from "../../context/ToastContext";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const EditFaq = ({ faq, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const { openToast } = useContext(ToastContext);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [categoriesMeta, setCategoriesMeta] = useState([]);
  const [categoryTouched, setCategoryTouched] = useState(false);

  const [formFields, setFormFields] = useState({
    category: "",
    categoryIcon: "",
    categoryDescription: "",
    question: "",
    answer: "",
    status: "draft",
    order: 0,
  });

  useEffect(() => {
    fetchDataFromApi("/api/help-faq/getCategories").then((res) => {
      if (!res?.error) setCategoriesMeta(res.categories || []);
    });
  }, []);

  useEffect(() => {
    if (!faq) return;

    setFormFields({
      category: faq.category || "",
      categoryIcon: faq.categoryIcon || "",
      categoryDescription: faq.categoryDescription || "",
      question: faq.question || "",
      answer: faq.answer || "",
      status: faq.status || "draft",
      order: faq.order ?? 0,
    });
  }, [faq]);

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryBlur = () => {
    const match = categoriesMeta.find(
      (c) => c.title.toLowerCase() === formFields.category.trim().toLowerCase()
    );

    if (match && !categoryTouched) {
      setFormFields((prev) => ({
        ...prev,
        categoryIcon: prev.categoryIcon || match.icon || "",
        categoryDescription: prev.categoryDescription || match.description || "",
      }));
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formFields.category.trim())
      return openToast("error", "La catégorie est obligatoire");
    if (!formFields.categoryIcon)
      return openToast("error", "L'icône de catégorie est obligatoire");
    if (!formFields.question.trim())
      return openToast("error", "La question est obligatoire");
    if (!formFields.answer.trim())
      return openToast("error", "La réponse est obligatoire");

    try {
      setLoadingSubmit(true);

      const payload = {
        category: formFields.category.trim(),
        categoryIcon: formFields.categoryIcon,
        categoryDescription: formFields.categoryDescription.trim(),
        question: formFields.question.trim(),
        answer: formFields.answer.trim(),
        status: formFields.status,
        order: Number(formFields.order) || 0,
      };

      const res = await editData(`/api/help-faq/update/${faq._id}`, payload);

      if (!res?.success) {
        throw new Error(res?.message || "Erreur mise à jour");
      }

      openToast("success", "Question mise à jour");
      setTimeout(handleClose, 500);
    } catch (error) {
      console.error(error);
      openToast("error", error.message || "Erreur serveur");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="hlpf-overlay">
      <div className={`hlpf-content ${isClosing ? "closing" : "opening"}`}>
        <div className="hlpf-header">
          <button className="hlpf-close-btn" onClick={handleClose}>
            <FaTimes />
          </button>
          <h2>Modifier la question</h2>
        </div>

        <div className="hlpf-body">
          <form onSubmit={handleSubmit} className="hlpf-form">
            <div className="hlpf-row">
              <div className="hlpf-form-group">
                <label>Catégorie</label>
                <input
                  type="text"
                  name="category"
                  list="help-faq-categories-edit"
                  value={formFields.category}
                  onChange={(e) => {
                    setCategoryTouched(false);
                    onChangeInput(e);
                  }}
                  onBlur={handleCategoryBlur}
                />
                <datalist id="help-faq-categories-edit">
                  {categoriesMeta.map((c) => (
                    <option key={c.key} value={c.title} />
                  ))}
                </datalist>
              </div>

              <div className="hlpf-form-group">
                <label>Icône de catégorie</label>
                <IconPicker
                  value={formFields.categoryIcon}
                  onChange={(iconName) => {
                    setCategoryTouched(true);
                    setFormFields((prev) => ({ ...prev, categoryIcon: iconName }));
                  }}
                />
              </div>
            </div>

            <div className="hlpf-form-group">
              <label>Description courte de la catégorie</label>
              <input
                type="text"
                name="categoryDescription"
                value={formFields.categoryDescription}
                onChange={(e) => {
                  setCategoryTouched(true);
                  onChangeInput(e);
                }}
              />
            </div>

            <div className="hlpf-form-group">
              <label>Question</label>
              <input
                type="text"
                name="question"
                value={formFields.question}
                onChange={onChangeInput}
              />
            </div>

            <div className="hlpf-form-group">
              <label>Réponse</label>
              <textarea name="answer" value={formFields.answer} onChange={onChangeInput} />
            </div>

            <div className="hlpf-row">
              <div className="hlpf-form-group">
                <label>Ordre d'affichage</label>
                <input
                  type="number"
                  name="order"
                  value={formFields.order}
                  onChange={onChangeInput}
                />
              </div>

              <div className="hlpf-form-group hlpf-toggle">
                <label>Publiée</label>
                <div
                  className={`hlpf-switch ${formFields.status === "published" ? "active" : ""}`}
                  onClick={() =>
                    setFormFields((prev) => ({
                      ...prev,
                      status: prev.status === "published" ? "draft" : "published",
                    }))
                  }
                >
                  <div className="hlpf-slider" />
                </div>
              </div>
            </div>

            <button type="submit" className="hlpf-publish-btn" disabled={loadingSubmit}>
              {loadingSubmit ? <CircularProgress /> : "Mettre à jour"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditFaq;