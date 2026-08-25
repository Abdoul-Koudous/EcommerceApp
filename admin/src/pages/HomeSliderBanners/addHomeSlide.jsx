import React, { useState, useEffect, useContext } from "react";
import { FaTimes } from "react-icons/fa";
import "./homeSlideForm.scss";
import { postData } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import HomeSlideForm from "./HomeSlideForm";

const AddHomeSlide = ({ onClose, onAddSlide }) => {
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
    try {
      const res = await postData("/api/homeSlide/create", fields);

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
            <h2>Ajouter un slide</h2>
          </div>
        </div>

        <div className="hsf-body">
          <HomeSlideForm onSubmit={handleSubmit} submitLabel="Publier" />
        </div>
      </div>
    </div>
  );
};

export default AddHomeSlide;