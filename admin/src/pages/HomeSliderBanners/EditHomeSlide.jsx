import React, { useState, useEffect, useContext } from "react";
import { FaTimes } from "react-icons/fa";
import "./homeSlideForm.scss";
import { editData } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import HomeSlideForm from "./HomeSlideForm";

const EditHomeSlide = ({ slide, onClose, onUpdateSlide }) => {
  const [isClosing, setIsClosing] = useState(false);
  const { openToast } = useContext(ToastContext);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 400);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  const handleSubmit = async (fields) => {
    if (!slide?._id) {
      return openToast("error", "Slide non existant pour édition");
    }

    try {
      const res = await editData(`/api/homeSlide/${slide._id}`, fields);

      if (res.success) {
        openToast("success", res.message || "Slide modifié avec succès");
        if (typeof onUpdateSlide === "function") onUpdateSlide(res.slide);
        setTimeout(() => handleClose(), 500);
      } else {
        openToast("error", res.message || "Erreur lors de l'opération");
      }
    } catch (err) {
      openToast("error", err.message || "Erreur réseau");
    }
  };

  return (
    <div className="hsf-overlay">
      <div className={`hsf-content ${isClosing ? "closing" : "opening"}`}>
        <div className="hsf-header">
          <div className="hsf-header-left">
            <button className="hsf-close-btn" onClick={handleClose}>
              <FaTimes />
            </button>
            <h2>Modifier un slide</h2>
          </div>
        </div>

        <div className="hsf-body">
          <HomeSlideForm
            initialSlide={slide}
            onSubmit={handleSubmit}
            submitLabel="Enregistrer"
          />
        </div>
      </div>
    </div>
  );
};

export default EditHomeSlide;