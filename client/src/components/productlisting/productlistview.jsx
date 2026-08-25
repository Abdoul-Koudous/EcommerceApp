import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaExchangeAlt,
  FaHeart,
  FaStar,
  FaRegStar,
  FaCartPlus,
} from "react-icons/fa";
import "./productlistview.scss";
import ProductPopup from "../productmodal";
import { UserContext } from "../../UserContext/UserContext";
import { ToastContext } from "../../context/ToastContext";
import { postData, deleteData, editData } from "../../pages/utils/api";
import { getSessionId, trackEvent } from "../../pages/utils/tracking";

// longueur de description avant troncature + "Voir plus"
const DESC_PREVIEW_LENGTH = 580;

const ProductItemView = ({ product }) => {
  const [hovered, setHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const {
    user,
    compareItems,
    loadCompareItems,
    myListItems,
    loadMyListItems,
    cartItems,
    loadCartItems,
  } = useContext(UserContext);
  const { openToast } = useContext(ToastContext);

  const [isCompared, setIsCompared] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [loadingCart, setLoadingCart] = useState(false);

  const handleOpenPopup = () => setShowPopup(true);
  const handleClosePopup = () => setShowPopup(false);

  const {
    _id,
    name,
    description,
    price,
    oldPrice,
    rating = 0,
    discount = 0,
    isNew = false,
    images = [],
    category,
    brand,
    hasVariants = false,
    variants = [],
    useVariantStock = false,
    countIntStock = 0,
    size = [],
    colors = [],
    productRam = [],
    productWeight = [],
  } = product;

  useEffect(() => {
    const exists = compareItems?.some((item) => item.productId === _id);
    setIsCompared(exists);
  }, [compareItems, _id]);

  useEffect(() => {
    const exists = myListItems?.some((item) => item.productId === _id);
    setIsFavorite(exists);
  }, [myListItems, _id]);

  const currentCartItem = cartItems?.find((item) => item.productId === _id);

  const handleAddToCompare = (e) => {
    e.stopPropagation();

    if (!user?._id) {
      openToast("error", "Veuillez vous connecter");
      return;
    }

    if (compareLoading) return;

    setCompareLoading(true);

    if (isCompared) {
      deleteData(`/api/compare/remove/${_id}`)
        .then((res) => {
          if (res?.success) {
            setIsCompared(false);
            loadCompareItems();
            openToast("success", res?.message || "Retiré du comparateur");
          } else {
            openToast("error", res?.message || "Erreur suppression");
          }
        })
        .catch(() => {
          openToast("error", "Erreur serveur");
        })
        .finally(() => {
          setCompareLoading(false);
        });

      return;
    }

    const data = {
      productId: _id,
      productTitle: name,
      image: images?.[0] || "",
      rating: rating || "0",
      price,
      oldPrice: oldPrice || 0,
      brand: brand || category?.name || "Sans marque",
      discount: discount || 0,
    };

    postData("/api/compare/add", data)
      .then((res) => {
        if (res?.success) {
          setIsCompared(true);
          loadCompareItems();
          openToast("success", res?.message || "Ajouté au comparateur");
        } else {
          openToast("error", res?.message || "Erreur ajout");
        }
      })
      .catch(() => {
        openToast("error", "Erreur serveur");
      })
      .finally(() => {
        setCompareLoading(false);
      });
  };

  const handleAddToFavorite = (e) => {
    e.stopPropagation();

    if (!user?._id) {
      openToast("error", "Veuillez vous connecter");
      return;
    }

    if (favoriteLoading) return;

    setFavoriteLoading(true);

    if (isFavorite) {
      deleteData(`/api/mylist/remove/${_id}`)
        .then((res) => {
          if (res?.success) {
            setIsFavorite(false);
            loadMyListItems();
            openToast("success", res?.message || "Retiré des favoris");
          } else {
            openToast("error", res?.message || "Erreur suppression");
          }
        })
        .catch(() => {
          openToast("error", "Erreur serveur");
        })
        .finally(() => {
          setFavoriteLoading(false);
        });

      return;
    }

    postData("/api/mylist/add", {
      productId: _id,
      productTitle: name,
      image: images?.[0] || "",
      rating: rating || "0",
      price,
      oldPrice: oldPrice || 0,
      brand: brand || category?.name || "Sans marque",
      discount: discount || 0,
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
      .catch(() => {
        openToast("error", "Erreur serveur");
      })
      .finally(() => {
        setFavoriteLoading(false);
      });
  };

  // Le produit demande-t-il un choix avant ajout ?
  const needsSelection =
    (hasVariants && variants.length > 0) ||
    (!hasVariants &&
      (size.length > 0 ||
        colors.length > 0 ||
        productRam.length > 0 ||
        productWeight.length > 0));

  // Ajout direct au panier (produit sans variantes/options)
  const quickAddToCart = () => {
    if (!countIntStock || countIntStock <= 0) {
      openToast("error", "Ce produit est en rupture de stock");
      return;
    }

    setLoadingCart(true);

    const data = {
      productTitle: name,
      image: images?.[0] || "",
      price,
      oldPrice,
      discount,
      productId: _id,
      quantity: 1,
      userId: user?._id,
      rating,
      countInStock: countIntStock,
      brand,
      size: null,
      color: null,
      ram: null,
      weight: null,
      sizeOptions: [],
      colorOptions: [],
      ramOptions: [],
      weightOptions: [],
      selectedVariants: {},
      guestSessionId: user?._id ? undefined : getSessionId(),
    };

    const request = currentCartItem
      ? editData("/api/cart/update-qty", {
          _id: currentCartItem._id,
          qty: currentCartItem.quantity + 1,
          guestSessionId: user?._id ? undefined : getSessionId(),
        })
      : postData("/api/cart/add", data);

    request
      .then((res) => {
        if (res?.success) {
          openToast("success", currentCartItem ? "Panier mis à jour" : "Produit ajouté");
          loadCartItems();
          if (!currentCartItem) {
            trackEvent("ADD_TO_CART", { productId: _id, amount: price });
          }
        } else {
          openToast("error", res?.message || "Erreur");
        }
      })
      .catch(() => {
        openToast("error", "Erreur serveur");
      })
      .finally(() => {
        setLoadingCart(false);
      });
  };

  // Hybride — toast + popup si choix requis, sinon ajout direct
  const handleAddToCartClick = (e) => {
    e.stopPropagation();

    if (needsSelection) {
      openToast("info", "Veuillez choisir vos options avant l'ajout au panier");
      handleOpenPopup();
      return;
    }

    quickAddToCart();
  };

  // Ajout au panier depuis le popup (avec variantes sélectionnées)
  const handleAddToCartFromPopup = (productId, userId, qty, selection) => {
    const { size: selSize, color: selColor, ram: selRam, weight: selWeight, selectedVariants } = selection;

    let effPrice = price;
    let effStock = countIntStock;

    if (hasVariants && useVariantStock) {
      const combo = product.variantCombinations?.find((c) => {
        const comboObj = c.combination || {};
        return (
          Object.keys(selectedVariants).length === Object.keys(comboObj).length &&
          Object.entries(selectedVariants).every(([k, v]) => comboObj[k] === v)
        );
      });
      if (combo) {
        effStock = combo.stock;
        if (combo.price != null) effPrice = combo.price;
      }
    }

    setLoadingCart(true);

    postData("/api/cart/add", {
      productTitle: name,
      image: images?.[0] || "",
      price: effPrice,
      oldPrice,
      discount,
      productId,
      quantity: qty,
      userId,
      rating,
      countInStock: effStock,
      brand,
      size: selSize,
      color: selColor,
      ram: selRam,
      weight: selWeight,
      sizeOptions: size,
      colorOptions: colors,
      ramOptions: productRam,
      weightOptions: productWeight,
      selectedVariants: hasVariants ? selectedVariants : {},
      guestSessionId: userId ? undefined : getSessionId(),
    })
      .then((res) => {
        if (res?.success) {
          openToast("success", "Produit ajouté");
          loadCartItems();
          trackEvent("ADD_TO_CART", { productId, amount: effPrice * qty });
        } else {
          openToast("error", res?.message || "Erreur ajout");
        }
      })
      .catch(() => {
        openToast("error", "Erreur serveur");
      })
      .finally(() => {
        setLoadingCart(false);
      });
  };

  // Redirige vers la fiche produit, ancrée sur la description
  const handleSeeMoreDescription = (e) => {
    e.stopPropagation();
    navigate(`/product/${_id}#description`);
  };

  const isDescTruncated =
    !!description && description.length > DESC_PREVIEW_LENGTH;

  return (
    <>
      {/* ✅ NOUVEAU DESIGN — classes préfixées "plv-" (Product List View v2)
          pour être certain qu'aucune ancienne règle .pil-* résiduelle
          ne puisse interférer avec cette mise en page. */}
      <div
        className="plv-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image */}
        <div
          className="plv-media"
          onClick={() => navigate(`/product/${_id}`)}
        >
          <img src={hovered && images[1] ? images[1] : images[0]} alt={name} />

          {discount > 0 && <div className="plv-discount-badge">-{discount}%</div>}
          {isNew && <div className="plv-new-badge">Nouveau</div>}

          <div className={`plv-icon-overlay ${hovered ? "plv-show" : ""}`}>
            <button
              className={`plv-icon plv-compare ${isCompared ? "plv-active" : ""}`}
              title="Comparer"
              onClick={handleAddToCompare}
              disabled={compareLoading}
            >
              <FaExchangeAlt />
            </button>
            <button
              className="plv-icon plv-view"
              title="Voir le produit"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPopup();
              }}
            >
              <FaEye />
            </button>
            <button
              className={`plv-icon plv-favorite ${isFavorite ? "plv-active" : ""}`}
              title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              onClick={handleAddToFavorite}
              disabled={favoriteLoading}
            >
              <FaHeart />
            </button>
          </div>
        </div>

        {/* Corps de la carte : 2 blocs nettement séparés, juste à côté de l'image */}
        <div className="plv-body">
          {/* Bloc gauche : catégorie, titre, description */}
          <div className="plv-main">
            <p className="plv-category">
              {category?.name || "Catégorie"}
            </p>
            <h4
              className="plv-title"
              onClick={() => navigate(`/product/${_id}`)}
            >
              {name}
            </h4>
            <p className="plv-desc">
              {isDescTruncated
                ? description.slice(0, DESC_PREVIEW_LENGTH).trimEnd() + "…"
                : description}
              {isDescTruncated && (
                <button
                  type="button"
                  className="plv-desc-more"
                  onClick={handleSeeMoreDescription}
                >
                  Voir plus
                </button>
              )}
            </p>
          </div>

          {/* Séparateur vertical visible entre les 2 blocs */}
          <div className="plv-divider" aria-hidden="true" />

          {/* Bloc droit : note, prix, ajout au panier */}
          <div className="plv-aside">
            <div className="plv-rating">
              {[...Array(5)].map((_, i) => (
                i < rating ? (
                  <FaStar key={i} className="plv-star-filled" size={16} />
                ) : (
                  <FaRegStar key={i} className="plv-star-empty" size={16} />
                )
              ))}
            </div>

            <div className="plv-price-box">
              {oldPrice > 0 && <span className="plv-old-price">{oldPrice} FCFA</span>}
              <span className="plv-price">{price} FCFA</span>
            </div>

            <button
              className="plv-cart-btn"
              onClick={handleAddToCartClick}
              disabled={loadingCart}
            >
              <FaCartPlus style={{ marginRight: "5px" }} />
              {loadingCart
                ? "Ajout..."
                : needsSelection
                ? "Choisir les options"
                : currentCartItem
                ? "Mettre à jour"
                : "Ajouter au panier"}
            </button>
          </div>
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <ProductPopup
          product={product}
          onClose={handleClosePopup}
          addToCart={handleAddToCartFromPopup}
          user={user}
        />
      )}
    </>
  );
};

export default ProductItemView;