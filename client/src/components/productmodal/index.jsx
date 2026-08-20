import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  FaStar,
  FaRegStar,
  FaHeart,
  FaCartPlus,
  FaBalanceScale,
  FaTimes,
} from "react-icons/fa";
import ProductZoom from "../productzoom";
import "./productpopup.scss";

const ProductPopup = ({ product, onClose, addToCart, user }) => {
  const [quantity, setQuantity] = useState(1);

  // Ancien système (conservé pour rétrocompatibilité)
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedRam, setSelectedRam] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(null);

  // ✅ NOUVEAU : sélection générique pour le système de variantes V2
  const [selectedVariants, setSelectedVariants] = useState({});

  // ✅ NOUVEAU : présélectionne la première valeur de chaque type de variante
  useEffect(() => {
    if (!product?.hasVariants || !product?.variants?.length) return;

    setSelectedVariants((prev) => {
      const next = { ...prev };
      product.variants.forEach((v) => {
        if (!next[v.name] && v.values?.length > 0) {
          next[v.name] = v.values[0];
        }
      });
      return next;
    });
  }, [product]);

  // ✅ NOUVEAU : retrouve la combinaison exacte correspondant à la sélection
  const matchedCombination = useMemo(() => {
    if (!product?.hasVariants || !product?.variants?.length) return undefined;

    const allTypesSelected = product.variants.every(
      (v) => selectedVariants[v.name],
    );
    if (!allTypesSelected) return null;

    return (
      product.variantCombinations?.find((combo) => {
        const comboObj = combo.combination || {};
        return (
          Object.keys(selectedVariants).length ===
            Object.keys(comboObj).length &&
          Object.entries(selectedVariants).every(
            ([key, val]) => comboObj[key] === val,
          )
        );
      }) || null
    );
  }, [product, selectedVariants]);

  const effectiveStock = useMemo(() => {
    if (product?.hasVariants && product?.useVariantStock) {
      return matchedCombination ? matchedCombination.stock : 0;
    }
    return product?.countIntStock || 0;
  }, [product, matchedCombination]);

  const effectivePrice = useMemo(() => {
    if (
      matchedCombination &&
      matchedCombination.price !== null &&
      matchedCombination.price !== undefined
    ) {
      return matchedCombination.price;
    }
    return product?.price || 0;
  }, [product, matchedCombination]);

  const isOutOfStock = effectiveStock <= 0;

  // ✅ bloque le scroll de la page tant que le popup est ouvert,
  // et le restaure proprement à la fermeture (même si le composant est démonté brutalement)
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleSelectVariant = (variantName, value) => {
    setSelectedVariants((prev) => ({ ...prev, [variantName]: value }));
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      alert("Ce produit est en rupture de stock");
      return;
    }

    // ✅ NOUVEAU SYSTÈME
    if (product.hasVariants && product.variants?.length > 0) {
      const missingType = product.variants.find(
        (v) => !selectedVariants[v.name],
      );
      if (missingType) {
        alert(`Veuillez choisir : ${missingType.name}`);
        return;
      }

      if (!matchedCombination) {
        alert("Cette combinaison n'est pas disponible");
        return;
      }

      if (!matchedCombination.isActive) {
        alert("Cette combinaison n'est plus disponible");
        return;
      }
    } else {
      // ⚠️ ANCIEN SYSTÈME : comportement inchangé
      if (product.size?.length > 0 && !selectedSize) {
        alert("Choisissez une taille");
        return;
      }

      if (product.colors?.length > 0 && !selectedColor) {
        alert("Choisissez une couleur");
        return;
      }

      if (product.productRam?.length > 0 && !selectedRam) {
        alert("Choisissez une RAM");
        return;
      }

      if (product.productWeight?.length > 0 && !selectedWeight) {
        alert("Choisissez un poids");
        return;
      }
    }

    addToCart(product._id, user?._id, quantity, {
      size: selectedSize,
      color: selectedColor,
      ram: selectedRam,
      weight: selectedWeight,
      // ✅ NOUVEAU
      selectedVariants: product.hasVariants ? selectedVariants : {},
    });

    onClose();
  };

  const handleIncrement = () => {
    if (isOutOfStock) return;
    setQuantity((q) => Math.min(q + 1, effectiveStock));
  };
  const handleDecrement = () =>
    setQuantity(quantity > 1 ? quantity - 1 : 1);

  return createPortal(
    <div className="pp-overlay" onClick={onClose}>
      <div className="pp-content" onClick={(e) => e.stopPropagation()}>
        <button className="pp-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="pp-container">
          {/* Images */}
          <div className="pp-zoom-cont">
            {product.images?.length > 0 && <ProductZoom images={product.images} />}
          </div>

          {/* Infos */}
          <div className="pp-info-cont">
            <h2 className="pp-title">{product.name}</h2>

            {/* Marque + rating */}
            {(product.brand || product.rating > 0) && (
  <div className="pp-brand-rating">
    {product.brand && <span className="pp-brand">Marque: {product.brand}</span>}
    {product.rating != null && (
      <div className="pp-rating">
                    {[...Array(5)].map((_, i) => (
                      i < product.rating ? (
                        <FaStar key={i} className="pp-star-filled" size={16} />
                      ) : (
                        <FaRegStar key={i} className="pp-star-empty" size={16} />
                      )
                    ))}
                    <span className="pp-reviews">({product.rating} Avis)</span>
                  </div>
                )}
              </div>
            )}

            {/* Prix et stock */}
            <div className="pp-price-stock">
              {product.oldPrice > 0 && <span className="pp-old-price">{product.oldPrice} FCFA</span>}
              <span className="pp-price">{effectivePrice} FCFA</span>
              <span className={`pp-stock ${effectiveStock > 0 ? "pp-in-stock" : "pp-out-of-stock"}`}>
                {effectiveStock > 0
                  ? `En stock (${effectiveStock})`
                  : "Indisponible"}
              </span>
            </div>

            {/* Description */}
            {product.description && <p className="pp-desc">{product.description}</p>}

            {/* ✅ NOUVEAU : sélecteurs de variantes génériques */}
            {product.hasVariants && product.variants?.length > 0 && (
              <div className="pp-characteristics">
                {product.variants.map((variant) => (
                  <div className="pp-option-group" key={variant.name}>
                    <span className="pp-option-label">{variant.name}:</span>
                    {variant.values.map((value, i) => (
                      <button
                        key={i}
                        className={`pp-option-btn ${
                          selectedVariants[variant.name] === value
                            ? "pp-active"
                            : ""
                        }`}
                        onClick={() => handleSelectVariant(variant.name, value)}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Options (ancien système, affiché seulement si le nouveau
                système n'est pas utilisé) */}
            {!product.hasVariants && (
              <div className="pp-characteristics">
                {product.size?.length > 0 && (
                  <div className="pp-option-group">
                    <span className="pp-option-label">Tailles:</span>
                    {product.size.map((size, i) => (
                      <button
                        key={i}
                        className={`pp-option-btn ${size === selectedSize ? "pp-active" : ""}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}

                {product.colors?.length > 0 && (
                  <div className="pp-option-group">
                    <span className="pp-option-label">Couleurs:</span>
                    {product.colors.map((color, i) => (
                      <button
                        key={i}
                        className={`pp-option-btn ${color === selectedColor ? "pp-active" : ""}`}
                        style={{ backgroundColor: color.toLowerCase() }}
                        onClick={() => setSelectedColor(color)}
                      >
                        {color === selectedColor ? "✓" : ""}
                      </button>
                    ))}
                  </div>
                )}

                {product.productRam?.length > 0 && (
                  <div className="pp-option-group">
                    <span className="pp-option-label">RAM:</span>
                    {product.productRam.map((ram, i) => (
                      <button
                        key={i}
                        className={`pp-option-btn ${ram === selectedRam ? "pp-active" : ""}`}
                        onClick={() => setSelectedRam(ram)}
                      >
                        {ram}
                      </button>
                    ))}
                  </div>
                )}

                {product.productWeight?.length > 0 && (
                  <div className="pp-option-group">
                    <span className="pp-option-label">Poids:</span>
                    {product.productWeight.map((w, i) => (
                      <button
                        key={i}
                        className={`pp-option-btn ${w === selectedWeight ? "pp-active" : ""}`}
                        onClick={() => setSelectedWeight(w)}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                )}

                <div className="pp-selected-characteristics">
                  { [selectedSize, selectedColor, selectedRam, selectedWeight]
                      .filter(Boolean)
                      .join(" | ") }
                </div>
              </div>
            )}

            {/* Quantité */}
            <div className="pp-cart-actions">
              <div className="pp-quantity">
                <button onClick={handleDecrement} disabled={isOutOfStock}>-</button>
                <span>{quantity}</span>
                <button onClick={handleIncrement} disabled={isOutOfStock}>+</button>
              </div>

              <button className="pp-add-cart" onClick={handleAddToCart} disabled={isOutOfStock}>
                <FaCartPlus /> Ajouter au panier
              </button>
            </div>

            {/* Actions */}
            <div className="pp-extra-actions">
              <button className="pp-wishlist">
                <FaHeart /> Favoris
              </button>

              <button className="pp-compare">
                <FaBalanceScale /> Comparer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductPopup;