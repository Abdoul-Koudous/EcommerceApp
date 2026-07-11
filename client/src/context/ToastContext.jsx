import { createContext, useState } from "react";
import "./ToastContext.scss";

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const openToast = (type, message) => {
    const id = Date.now();

    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto close after 3 sec
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ openToast }}>
      {children}

      {/* Rendu des toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === "success" ? "✔️" : t.type === "info" ? "ℹ️" : "❌"}{" "}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
