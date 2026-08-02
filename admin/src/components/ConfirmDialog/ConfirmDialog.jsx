import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import "./confirmDialog.scss";
import CircularProgress from "../CircularProgress/CircularProgress";

const ConfirmDialog = ({ open, message, onConfirm, onCancel }) => {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cfd-overlay">
      <div className="cfd-dialog">
        <div className="cfd-header">
          <h3>Confirmation</h3>
          <button className="cfd-close-btn" onClick={onCancel}>
            <FaTimes />
          </button>
        </div>
        <div className="cfd-body">
          <p>{message}</p>
        </div>
        <div className="cfd-footer">
          <button className="cfd-btn cfd-cancel" onClick={onCancel} disabled={loading}>
            Annuler
          </button>
          <button className="cfd-btn cfd-confirm" onClick={handleConfirm} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;