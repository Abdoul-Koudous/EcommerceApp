import React, { useState, useRef, useEffect } from "react";
import { iconOptions, getIconComponent } from "../../pages/utils/iconOptions";
import "./iconpicker.scss";

const IconPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const SelectedIcon = getIconComponent(value);
  const selectedLabel = iconOptions.find((opt) => opt.name === value)?.label;

  // ✅ ferme le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (name) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <div className="icon-picker" ref={wrapperRef}>
      <button
        type="button"
        className="icon-picker__trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="icon-picker__preview">
          <SelectedIcon />
        </span>
        <span className="icon-picker__label">
          {selectedLabel || "Choisir une icône"}
        </span>
      </button>

      {open && (
        <div className="icon-picker__dropdown">
          <div className="icon-picker__grid">
            {iconOptions.map((opt) => {
              const OptIcon = opt.Icon;
              return (
                <button
                  type="button"
                  key={opt.name}
                  className={`icon-picker__item ${value === opt.name ? "active" : ""}`}
                  onClick={() => handleSelect(opt.name)}
                  title={opt.label}
                >
                  <OptIcon />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default IconPicker;