import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const DropdownMultiSelect = ({ label, options = [], selectedValues = [], onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Toggle ouverture/fermeture
  const toggleOpen = () => setOpen((prev) => !prev);

  // Ajouter ou retirer une valeur
  const toggleSelection = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  // Fermer dropdown si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Affichage texte
  const displayText =
    Array.isArray(selectedValues) && selectedValues.length > 0
      ? selectedValues.join(", ")
      : "Sélectionner...";

  return (
    <div className="multi-select" ref={containerRef}>
      {label && <label>{label}</label>}
      <div className="selected-values" onClick={toggleOpen}>
        <span>{displayText}</span>
        <span className="icon">{open ? <FaChevronUp /> : <FaChevronDown />}</span>
      </div>

      {open && (
        <div className="options">
          {options.map((opt) => (
            <div
              key={opt}
              className={`option ${selectedValues.includes(opt) ? "selected" : ""}`}
              onClick={() => toggleSelection(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMultiSelect;
