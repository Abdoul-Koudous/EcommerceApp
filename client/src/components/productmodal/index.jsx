import React, { useState, useEffect, useMemo, useContext } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  FaStar,
  FaRegStar,
  FaHeart,
  FaCartPlus,
  FaBalanceScale,
  FaTimes,
} from "react-icons/fa";
import ProductZoom from "../productzoom";
import { UserContext } from "../../UserContext/UserContext";
import { ToastContext } from "../../context/ToastContext";
import { postData, deleteData } from "../../pages/utils/api";
import "./productpopup.scss";

const DESC_PREVIEW_LENGTH = 220;

const ProductPopup = ({ product, onClose, addToCart, user }) => {
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);

  // Ancien système (conservé pour rétrocompatibilité)
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedRam, setSelectedRam] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(null);

  // Sélection générique pour le système de variantes V2
  const [selectedVariants, setSelectedVariants] = useState({});

  // Favoris + comparateur, autonomes dans le popup
  const { compareItems, loadCompareItems, myListItems, loadMyListItems } =
    useContext(UserContext);
  const { openToast } = useContext(ToastContext);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);

  useEffect(() => {
    const exists = myListItems?.some((item) => item.productId === product._id);
    setIsFavorite(exists);
  }, [myListItems, product._id]);

  useEffect(() => {
    const exists = compareItems?.some((item) => item.productId === product._id);
    setIsCompared(exists);
  }, [compareItems, product._id]);

  // Présélectionne la première valeur de chaque type de variante
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

  // Retrouve la combinaison exacte correspondant à la sélection
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

  // Bloque le scroll de la page tant que le popup est ouvert
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

  // Favoris (même logique que ProductItemView / ProductDetails)
  const handleToggleFavorite = () => {
    if (!user?._id) {
      openToast("error", "Veuillez vous connecter");
      return;
    }
    if (favoriteLoading) return;
    setFavoriteLoading(true);

    if (isFavorite) {
      deleteData(`/api/mylist/remove/${product._id}`)
        .then((res) => {
          if (res?.success) {
            setIsFavorite(false);
            loadMyListItems();
            openToast("success", res?.message || "Retiré des favoris");
          } else {
            openToast("error", res?.message || "Erreur suppression");
          }
        })
        .catch(() => openToast("error", "Erreur serveur"))
        .finally(() => setFavoriteLoading(false));
      return;
    }

    postData("/api/mylist/add", {
      productId: product._id,
      productTitle: product.name,
      image: product.images?.[0] || "",
      rating: product.rating || "0",
      price: effectivePrice,
      oldPrice: product.oldPrice || 0,
      brand: product.brand || "Sans marque",
      discount: product.discount || 0,
    })
      .then((res) => {
        if (res?.success) {
          setIsFavorite(true);
          loadMyListItems();
          openToast("success", res?.message || "Ajouté aux favoris ❤️");
        } else {
          openToast("error", res?.message || "Erreur ajout");
        }
      })
      .catch(() => openToast("error", "Erreur serveur"))
      .finally(() => setFavoriteLoading(false));
  };

  // Comparateur (même logique que ProductItemView / ProductDetails)
  const handleToggleCompare = () => {
    if (!user?._id) {
      openToast("error", "Veuillez vous connecter");
      return;
    }
    if (compareLoading) return;
    setCompareLoading(true);

    if (isCompared) {
      deleteData(`/api/compare/remove/${product._id}`)
        .then((res) => {
          if (res?.success) {
            setIsCompared(false);
            loadCompareItems();
            openToast("success", res?.message || "Retiré du comparateur");
          } else {
            openToast("error", res?.message || "Erreur suppression");
          }
        })
        .catch(() => openToast("error", "Erreur serveur"))
        .finally(() => setCompareLoading(false));
      return;
    }

    postData("/api/compare/add", {
      productId: product._id,
      productTitle: product.name,
      image: product.images?.[0] || "",
      rating: product.rating || "0",
      price: effectivePrice,
      oldPrice: product.oldPrice || 0,
      brand: product.brand || "Sans marque",
      discount: product.discount || 0,
    })
      .then((res) => {
        if (res?.success) {
          setIsCompared(true);
          loadCompareItems();
          openToast("success", res?.message || "Ajouté au comparateur");
        } else {
          openToast("error", res?.message || "Erreur ajout");
        }
      })
      .catch(() => openToast("error", "Erreur serveur"))
      .finally(() => setCompareLoading(false));
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      openToast("error", "Ce produit est en rupture de stock");
      return;
    }

    // Nouveau système (variantes V2)
    if (product.hasVariants && product.variants?.length > 0) {
      const missingType = product.variants.find(
        (v) => !selectedVariants[v.name],
      );
      if (missingType) {
        openToast("error", `Veuillez choisir : ${missingType.name}`);
        return;
      }

      if (!matchedCombination) {
        openToast("error", "Cette combinaison n'est pas disponible");
        return;
      }

      if (!matchedCombination.isActive) {
        openToast("error", "Cette combinaison n'est plus disponible");
        return;
      }
    } else {
      // Ancien système : comportement inchangé
      if (product.size?.length > 0 && !selectedSize) {
        openToast("error", "Choisissez une taille");
        return;
      }

      if (product.colors?.length > 0 && !selectedColor) {
        openToast("error", "Choisissez une couleur");
        return;
      }

      if (product.productRam?.length > 0 && !selectedRam) {
        openToast("error", "Choisissez une RAM");
        return;
      }

      if (product.productWeight?.length > 0 && !selectedWeight) {
        openToast("error", "Choisissez un poids");
        return;
      }
    }

    addToCart(product._id, user?._id, quantity, {
      size: selectedSize,
      color: selectedColor,
      ram: selectedRam,
      weight: selectedWeight,
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

  // ✅ ferme le popup et redirige vers la fiche produit, ancrée
  // directement sur la section Description. C'est ProductDetails qui
  // gère ensuite le scroll précis via son propre useEffect sur le hash.
  const handleSeeMoreDescription = () => {
    onClose();
    navigate(`/product/${product._id}#description`);
  };

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

            {/* ✅ DESCRIPTION tronquée avec "Voir plus" → redirige vers la fiche produit */}
            {product.description && (
              <p className="pp-desc">
                {product.description.length > DESC_PREVIEW_LENGTH
                  ? product.description.slice(0, DESC_PREVIEW_LENGTH).trimEnd() + "…"
                  : product.description}
                {product.description.length > DESC_PREVIEW_LENGTH && (
                  <button
                    type="button"
                    className="pp-desc-see-more"
                    onClick={handleSeeMoreDescription}
                  >
                    Voir plus
                  </button>
                )}
              </p>
            )}

            {/* Sélecteurs de variantes génériques */}
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
                  {[selectedSize, selectedColor, selectedRam, selectedWeight]
                    .filter(Boolean)
                    .join(" | ")}
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

            {/* Actions favoris/comparer fonctionnelles */}
            <div className="pp-extra-actions">
              <button
                className={`pp-wishlist ${isFavorite ? "pp-active" : ""}`}
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
              >
                <FaHeart /> {isFavorite ? "Favori" : "Favoris"}
              </button>

              <button
                className={`pp-compare ${isCompared ? "pp-active" : ""}`}
                onClick={handleToggleCompare}
                disabled={compareLoading}
              >
                <FaBalanceScale /> {isCompared ? "Comparé" : "Comparer"}
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