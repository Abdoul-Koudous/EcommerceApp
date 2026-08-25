import React, { useEffect, useState, useMemo } from "react";
import {
  FaShoppingCart,
  FaStar,
  FaSearch,
  FaEye,
  FaExchangeAlt,
  FaHeart,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import "./productitem.scss";
import ProductPopup from "../productmodal";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../../UserContext/UserContext";
import { ToastContext } from "../../context/ToastContext";
import { deleteData, editData, postData } from "../../pages/utils/api";
import CircularProgress from "../CircularProgress/CircularProgress";
import { trackEvent, getSessionId } from "../../pages/utils/tracking";

const resolveVariantCombination = (product, selectedVariants) => {
  if (
    !product?.hasVariants ||
    !selectedVariants ||
    Object.keys(selectedVariants).length === 0
  ) {
    return null;
  }
  return (
    product.variantCombinations?.find((combo) => {
      const comboObj = combo.combination || {};
      return (
        Object.keys(selectedVariants).length === Object.keys(comboObj).length &&
        Object.entries(selectedVariants).every(
          ([key, val]) => comboObj[key] === val,
        )
      );
    }) || null
  );
};

const ProductItem = ({ product }) => {
  const [hovered, setHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();
  const {
    user,
    cartItems,
    loadCartItems,
    loadMyListItems,
    myListItems,
    compareItems,
    loadCompareItems,
  } = useContext(UserContext);
  const { openToast } = useContext(ToastContext);
  const [catData, setCatData] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);

  const truncateDescription = (desc, maxLength = 100) => {
    if (!desc) return "";
    return desc.length > maxLength
      ? desc.substring(0, maxLength) + "..."
      : desc;
  };

  const images = product.images || [];
  const hasMultipleImages = images.length > 1;

  const truncateName = (name, maxWords = 3) => {
    if (!name) return "";
    const words = name.split(" ");
    return words.length <= maxWords
      ? name
      : words.slice(0, maxWords).join(" ") + "...";
  };

  const isNewProduct = (date) => {
    if (!date) return false;
    const now = new Date();
    const createdDate = new Date(date);
    const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  // Un visiteur non connecté peut ajouter au panier (guestSessionId prend le relais).
  const addToCart = (productId, userId, quantity, options = {}) => {
    const data = {
      productTitle: product.name,
      image: product.images[0] || "",
      price: product.price,
      oldPrice: product.oldPrice,
      discount: product.discount,
      productId,
      quantity,
      userId, // peut être undefined
      rating: product.rating,
      countInStock: product.countIntStock,
      brand: product.brand,

      size: options.size,
      color: options.color,
      ram: options.ram,
      weight: options.weight,

      sizeOptions: product.size || [],
      colorOptions: product.colors || [],
      ramOptions: product.productRam || [],
      weightOptions: product.productWeight || [],

      selectedVariants: options.selectedVariants || {},
      guestSessionId: userId ? undefined : getSessionId(),
    };
    setCartLoading(true);

    postData("/api/cart/add", data)
      .then((res) => {
        if (res?.success) {
          openToast("success", res?.message || "Produit ajouté au panier");
          setIsAdded(true);
          loadCartItems();
          trackEvent("ADD_TO_CART", {
            productId: product._id,
            amount: product.price * quantity,
          });
        } else {
          openToast(
            "error",
            res?.message || "Erreur lors de l'ajout au panier",
          );
        }
      })
      .catch(() => {
        openToast("error", "Erreur réseau lors de l'ajout au panier");
      })
      .finally(() => {
        setCartLoading(false);
      });
  };

  const currentCartItem = cartItems?.find(
    (item) => (item.productId?._id || item.productId) === product._id,
  );

  const currentSelectedVariants = useMemo(() => {
    if (!currentCartItem?.selectedVariants) return {};
    return currentCartItem.selectedVariants instanceof Map
      ? Object.fromEntries(currentCartItem.selectedVariants)
      : currentCartItem.selectedVariants;
  }, [currentCartItem]);

  const maxQtyForCard = useMemo(() => {
    if (product.hasVariants && product.useVariantStock) {
      const combo = resolveVariantCombination(product, currentSelectedVariants);
      return combo ? combo.stock : 0;
    }
    return product.countIntStock || 0;
  }, [product, currentSelectedVariants]);

  useEffect(() => {
    if (currentCartItem) {
      setQuantity(currentCartItem.quantity);
      setIsAdded(true);
    } else {
      setQuantity(1);
      setIsAdded(false);
    }
  }, [cartItems, currentCartItem]);

  const minusQty = () => {
    if (loading) return;

    if (!currentCartItem?._id) {
      console.log("Cart item introuvable");
      return;
    }

    const oldQty = quantity;

    setLoading(true);

    if (quantity > 1) {
      const newQty = quantity - 1;

      setQuantity(newQty);

      editData("/api/cart/update-qty", {
        _id: currentCartItem._id,
        qty: newQty,
        guestSessionId: user?._id ? undefined : getSessionId(),
      })
        .then((res) => {
          if (res?.success) {
            loadCartItems();
          } else {
            setQuantity(oldQty);
            openToast("error", "Erreur mise à jour");
          }
        })
        .catch(() => {
          setQuantity(oldQty);
          openToast("error", "Erreur serveur");
        })
        .finally(() => {
          setLoading(false);
        });

      return;
    }

    const deleteUrl = user?._id
      ? `/api/cart/delete-cart-item/${currentCartItem._id}`
      : `/api/cart/delete-cart-item/${currentCartItem._id}?guestSessionId=${getSessionId()}`;

    deleteData(deleteUrl)
      .then((res) => {
        if (res?.success) {
          openToast("success", "Produit retiré du panier");
          setIsAdded(false);
          setQuantity(1);
          loadCartItems();
        } else {
          openToast("error", "Erreur suppression");
        }
      })
      .catch(() => {
        openToast("error", "Erreur serveur");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const addQty = () => {
    if (loading) return;

    if (!currentCartItem?._id) {
      console.log("Cart item introuvable");
      return;
    }

    if (quantity >= maxQtyForCard) {
      openToast("error", "Stock insuffisant");
      return;
    }

    const oldQty = quantity;
    const newQty = quantity + 1;

    setLoading(true);
    setQuantity(newQty);

    editData("/api/cart/update-qty", {
      _id: currentCartItem._id,
      qty: newQty,
      guestSessionId: user?._id ? undefined : getSessionId(),
    })
      .then((res) => {
        if (res?.success) {
          openToast("success", res?.message || "Quantité mise à jour");
          loadCartItems();
        } else {
          setQuantity(oldQty);
          openToast("error", "Erreur mise à jour");
        }
      })
      .catch(() => {
        setQuantity(oldQty);
        openToast("error", "Erreur serveur");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const hasOptions =
    product.hasVariants && product.variants?.length > 0
      ? true
      : product.size?.length > 0 ||
        product.colors?.length > 0 ||
        product.productRam?.length > 0 ||
        product.productWeight?.length > 0;

  const handleAddClick = () => {
    if (hasOptions) {
      openToast("info", "Veuillez choisir vos options avant l'ajout au panier");
      setShowPopup(true);
    } else {
      addToCart(product._id, user?._id, quantity);
    }
  };

  const handleAddToMyList = () => {
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
        .catch(() => {
          openToast("error", "Erreur serveur");
        })
        .finally(() => {
          setFavoriteLoading(false);
        });

      return;
    }

    const data = {
      productId: product._id,
      productTitle: product.name,
      image: product.images?.[0] || "",
      rating: product.rating || "0",
      price: product.price,
      oldPrice: product.oldPrice || 0,
      brand: product.brand || "Sans marque",
      discount: product.discount || 0,
    };

    // ✅ CORRIGÉ : c'était postData("/api/compare/add", ...) — copié-collé
    // de handleAddToCompare qui envoyait les favoris dans le comparateur.
    postData("/api/mylist/add", data)
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

  const handleAddToCompare = () => {
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
        .catch(() => {
          openToast("error", "Erreur serveur");
        })
        .finally(() => {
          setCompareLoading(false);
        });

      return;
    }

    const data = {
      productId: product._id,
      productTitle: product.name,
      image: product.images?.[0] || "",
      rating: product.rating,
      price: product.price,
      oldPrice: product.oldPrice,
      brand: product.brand,
      discount: product.discount,
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

  useEffect(() => {
    const exists = myListItems?.some((item) => item.productId === product._id);
    setIsFavorite(exists);
  }, [myListItems, product._id]);

  useEffect(() => {
    const exists = compareItems?.some((item) => item.productId === product._id);
    setIsCompared(exists);
  }, [compareItems, product._id]);

  return (
    <>
      <div
        className="product-item"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="img-box"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/product/${product._id}`);
          }}
        >
          {images.length > 0 ? (
            <>
              {!imageLoaded && <div className="skeleton-image"></div>}
              <img
                src={hovered && hasMultipleImages ? images[1] : images[0]}
                alt={product.name}
                style={{ display: imageLoaded ? "block" : "none" }}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="no-image">Pas d'image</div>
          )}

          {product.discount > 0 && (
            <div className="discount-badge">-{product.discount}%</div>
          )}
          {isNewProduct(product.dateCreated) && (
            <div className="new-badge">Nouveau</div>
          )}

          <div className={`icon-overlay ${hovered ? "show" : ""}`}>
            <button
              className={`icon compare ${isCompared ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCompare();
              }}
              disabled={compareLoading}
            >
              <FaExchangeAlt />
            </button>
            <button
              className="icon view"
              onClick={(e) => {
                e.stopPropagation();
                setShowPopup(true);
              }}
            >
              <FaEye />
            </button>
            {/* <button className="icon zoom" onClick={(e) => e.stopPropagation()}>
              <FaSearch />
            </button> */}
            <button
              className={`icon favorite ${isFavorite ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleAddToMyList();
              }}
              disabled={favoriteLoading}
            >
              <FaHeart />
            </button>
          </div>
        </div>

        <h4>{truncateName(product.name)}</h4>
        <p className="desc">{product.brand || "Sans marque"}</p>

        <div className="rating">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              color={i < (product.rating || 0) ? "#FFD700" : "#ccc"}
              size={16}
            />
          ))}
        </div>

        <div className="price-box">
          {product.oldPrice > 0 && (
            <span className="old-price">{product.oldPrice} FCFA</span>
          )}
          <span className="price">{product.price} FCFA</span>
        </div>
        {isAdded === false ? (
          <button
            className="add-to-cart"
            onClick={handleAddClick}
            disabled={cartLoading}
          >
            {cartLoading ? (
              <span className="btn-loader">
                <CircularProgress />
              </span>
            ) : (
              <>
                <FaShoppingCart />
                <span>Ajouter au panier</span>
              </>
            )}
          </button>
        ) : (
          <div className="quantity-selector">
            <button onClick={minusQty} disabled={loading}>
              <FaMinus />
            </button>
            <span>{quantity}</span>
            <button onClick={addQty} disabled={loading}>
              <FaPlus />
            </button>
          </div>
        )}
      </div>

      {showPopup && (
        <ProductPopup
          product={product}
          onClose={() => setShowPopup(false)}
          addToCart={addToCart}
          user={user}
        />
      )}
    </>
  );
};

export default ProductItem;