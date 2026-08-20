import React, { useState } from "react";
import { FaTimes, FaPlus, FaMagic, FaTrash } from "react-icons/fa";
import { postData } from "../../pages/utils/api";
import { ToastContext } from "../../context/ToastContext";
import { useContext } from "react";
import CircularProgress from "../CircularProgress/CircularProgress";
import "./variantsmanager.scss";

// ────────────────────────────────────────────────────────────
// Composant réutilisable de gestion des variantes produit
// (Couleur, Taille, RAM, etc. — noms libres définis par le vendeur)
// Utilisé par AddProduct.jsx et EditProduct.jsx
//
// Props :
// - hasVariants, onToggleHasVariants
// - useVariantStock, onToggleUseVariantStock
// - variants, onChangeVariants
// - variantCombinations, onChangeCombinations
// ────────────────────────────────────────────────────────────
const VariantsManager = ({
  hasVariants,
  onToggleHasVariants,
  useVariantStock,
  onToggleUseVariantStock,
  variants,
  onChangeVariants,
  variantCombinations,
  onChangeCombinations,
}) => {
  const { openToast } = useContext(ToastContext);
  const [newValueInputs, setNewValueInputs] = useState({}); // { [variantIndex]: "texte en cours" }
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  // ── Gestion des types de variantes (ex: "Couleur", "Taille") ──

  const addVariantType = () => {
    onChangeVariants([...variants, { name: "", values: [] }]);
  };

  const removeVariantType = (index) => {
    onChangeVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariantName = (index, name) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], name };
    onChangeVariants(updated);
  };

  const addValueToVariant = (index) => {
    const text = (newValueInputs[index] || "").trim();
    if (!text) return;

    const updated = [...variants];
    // Évite les doublons de valeur pour un même type de variante
    if (!updated[index].values.includes(text)) {
      updated[index] = {
        ...updated[index],
        values: [...updated[index].values, text],
      };
      onChangeVariants(updated);
    }
    setNewValueInputs((prev) => ({ ...prev, [index]: "" }));
  };

  const removeValueFromVariant = (variantIndex, valueIndex) => {
    const updated = [...variants];
    updated[variantIndex] = {
      ...updated[variantIndex],
      values: updated[variantIndex].values.filter((_, i) => i !== valueIndex),
    };
    onChangeVariants(updated);
  };

  // ── Génération automatique des combinaisons (via l'API) ──

  const handleGenerateCombinations = async () => {
    const validVariants = variants.filter(
      (v) => v.name.trim() && v.values.length > 0,
    );

    if (validVariants.length === 0) {
      openToast(
        "error",
        "Ajoute au moins un type de variante avec des valeurs avant de générer",
      );
      return;
    }

    try {
      setLoadingGenerate(true);
      const res = await postData(
        "/api/product/generateVariantCombinations",
        { variants: validVariants },
      );

      if (!res?.success) {
        throw new Error(res?.message || "Erreur lors de la génération");
      }

      // On fusionne avec les combinaisons déjà existantes pour ne pas
      // écraser un stock/prix déjà saisi manuellement sur une combinaison
      // identique (le vendeur reste maître, cf. règle "auto ou manuel").
      const existingByKey = new Map(
        variantCombinations.map((c) => [
          JSON.stringify(c.combination),
          c,
        ]),
      );

      const merged = res.variantCombinations.map((generated) => {
        const key = JSON.stringify(generated.combination);
        return existingByKey.get(key) || generated;
      });

      onChangeCombinations(merged);
      openToast(
        "success",
        `${merged.length} combinaison(s) générée(s) — modifie stock/prix puis enregistre`,
      );
    } catch (error) {
      openToast("error", error.message || "Erreur serveur");
    } finally {
      setLoadingGenerate(false);
    }
  };

  // ── Édition des combinaisons (stock, prix, sku, actif) ──

  const updateCombination = (index, field, value) => {
    const updated = [...variantCombinations];
    updated[index] = { ...updated[index], [field]: value };
    onChangeCombinations(updated);
  };

  const removeCombination = (index) => {
    onChangeCombinations(variantCombinations.filter((_, i) => i !== index));
  };

  const formatCombinationLabel = (combination) => {
    return Object.entries(combination)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" · ");
  };

  if (!hasVariants) {
    // Même quand désactivé, on garde le toggle visible pour pouvoir l'activer.
    return (
      <div className="vm-container">
        <div className="apd-form-group apd-banner-toggle">
          <label>Ce produit a des variantes (couleur, taille, etc.)</label>
          <div
            className="apd-switch"
            onClick={() => onToggleHasVariants(true)}
          >
            <div className="apd-slider"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vm-container">
      <div className="apd-form-group apd-banner-toggle">
        <label>Ce produit a des variantes (couleur, taille, etc.)</label>
        <div
          className="apd-switch active"
          onClick={() => onToggleHasVariants(false)}
        >
          <div className="apd-slider"></div>
        </div>
      </div>

      {/* Définition des types de variantes */}
      <div className="vm-variant-types">
        {variants.map((variant, vIndex) => (
          <div key={vIndex} className="vm-variant-type-card">
            <div className="vm-variant-type-header">
              <input
                type="text"
                placeholder="Nom (ex: Couleur, Taille, RAM...)"
                value={variant.name}
                onChange={(e) => updateVariantName(vIndex, e.target.value)}
              />
              <button
                type="button"
                className="vm-icon-btn danger"
                onClick={() => removeVariantType(vIndex)}
                title="Supprimer ce type de variante"
              >
                <FaTrash />
              </button>
            </div>

            <div className="vm-values-list">
              {variant.values.map((value, valIndex) => (
                <span key={valIndex} className="vm-value-tag">
                  {value}
                  <button
                    type="button"
                    onClick={() => removeValueFromVariant(vIndex, valIndex)}
                  >
                    <FaTimes />
                  </button>
                </span>
              ))}
            </div>

            <div className="vm-add-value-row">
              <input
                type="text"
                placeholder="Ajouter une valeur (ex: Rouge) puis Entrée"
                value={newValueInputs[vIndex] || ""}
                onChange={(e) =>
                  setNewValueInputs((prev) => ({
                    ...prev,
                    [vIndex]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addValueToVariant(vIndex);
                  }
                }}
              />
              <button
                type="button"
                className="vm-icon-btn"
                onClick={() => addValueToVariant(vIndex)}
              >
                <FaPlus />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="vm-add-type-btn"
          onClick={addVariantType}
        >
          <FaPlus /> Ajouter un type de variante
        </button>
      </div>

      {/* Génération automatique */}
      {variants.length > 0 && (
        <button
          type="button"
          className="vm-generate-btn"
          onClick={handleGenerateCombinations}
          disabled={loadingGenerate}
        >
          {loadingGenerate ? (
            <CircularProgress size={20} />
          ) : (
            <>
              <FaMagic /> Générer les combinaisons automatiquement
            </>
          )}
        </button>
      )}

      {/* Stock par variante ou stock global */}
      {variantCombinations.length > 0 && (
        <>
          <div className="apd-form-group apd-banner-toggle">
            <label>Gérer le stock par combinaison (sinon stock global du produit)</label>
            <div
              className={`apd-switch ${useVariantStock ? "active" : ""}`}
              onClick={() => onToggleUseVariantStock(!useVariantStock)}
            >
              <div className="apd-slider"></div>
            </div>
          </div>

          {/* Tableau des combinaisons */}
          <div className="vm-combinations-table">
            <div className="vm-combinations-header">
              <span>Combinaison</span>
              {useVariantStock && <span>Stock</span>}
              <span>Prix (optionnel)</span>
              <span>SKU (optionnel)</span>
              <span>Actif</span>
              <span></span>
            </div>

            {variantCombinations.map((combo, index) => (
              <div key={index} className="vm-combination-row">
                <span className="vm-combo-label">
                  {formatCombinationLabel(combo.combination)}
                </span>

                {useVariantStock && (
                  <input
                    type="number"
                    min="0"
                    value={combo.stock}
                    onChange={(e) =>
                      updateCombination(
                        index,
                        "stock",
                        Number(e.target.value),
                      )
                    }
                  />
                )}

                <input
                  type="number"
                  min="0"
                  placeholder="Prix produit"
                  value={combo.price ?? ""}
                  onChange={(e) =>
                    updateCombination(
                      index,
                      "price",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />

                <input
                  type="text"
                  placeholder="SKU"
                  value={combo.sku || ""}
                  onChange={(e) =>
                    updateCombination(index, "sku", e.target.value)
                  }
                />

                <div
                  className={`apd-switch small ${combo.isActive ? "active" : ""}`}
                  onClick={() =>
                    updateCombination(index, "isActive", !combo.isActive)
                  }
                >
                  <div className="apd-slider"></div>
                </div>

                <button
                  type="button"
                  className="vm-icon-btn danger"
                  onClick={() => removeCombination(index)}
                  title="Supprimer cette combinaison"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default VariantsManager;