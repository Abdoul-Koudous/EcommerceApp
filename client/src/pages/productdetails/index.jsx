import { Link, useParams } from "react-router-dom";
import { useContext, useEffect, useState, useMemo } from "react";

import "./productdetail.scss";
import { FaHeart, FaCartPlus, FaBalanceScale, FaStar, FaRegStar } from "react-icons/fa";
import ProductZoom from "../../components/productzoom";
import ProductSlider from "../../components/productslider";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import Reviews from "./reviews";
import { UserContext } from "../../UserContext/UserContext";
import { postData, editData, fetchDataFromApi } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";

const ProductDetails = () => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewsCount, setReviewsCount] = useState(0);

  const [quantity, setQuantity] = useState(1);
  const [loadingCart, setLoadingCart] = useState(false);

  // caractéristiques dynamiques (ancien système, conservé pour rétrocompatibilité)
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedRam, setSelectedRam] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(null);

  // ✅ NOUVEAU : sélection générique pour le système de variantes V2
  // Ex: { "Couleur": "Rouge", "Taille": "M" }
  const [selectedVariants, setSelectedVariants] = useState({});

  const [activeTab, setActiveTab] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  const { user, cartItems, loadCartItems } = useContext(UserContext);
  const { openToast } = useContext(ToastContext);

  const currentCartItem = cartItems?.find(
    (item) => item.productId === product?._id,
  );

  // ✅ NOUVEAU : retrouve la combinaison exacte correspondant à la sélection
  // en cours, pour connaître son stock/prix réels. null tant que la
  // sélection n'est pas complète, undefined si le produit n'a pas de
  // variantes du tout.
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

  // ✅ Stock et prix effectifs à afficher/utiliser, selon qu'on est sur
  // le nouveau système de variantes (avec stock détaillé) ou l'ancien
  // système / un produit simple.
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

  const handleAddToCart = () => {
    if (!user?._id) {
      openToast("error", "Veuillez vous connecter");
      return;
    }

    // ✅ NOUVEAU SYSTÈME : le produit a des types de variantes définis
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

      if (product.useVariantStock && matchedCombination.stock <= 0) {
        openToast("error", "Cette variante est en rupture de stock");
        return;
      }
    } else {
      // ⚠️ ANCIEN SYSTÈME : comportement inchangé
      if (!product?.countIntStock || product.countIntStock <= 0) {
        openToast("error", "Ce produit est en rupture de stock");
        return;
      }

      const hasOptions =
        product.size?.length ||
        product.colors?.length ||
        product.productRam?.length ||
        product.productWeight?.length;

      if (
        hasOptions &&
        !selectedSize &&
        !selectedColor &&
        !selectedRam &&
        !selectedWeight
      ) {
        openToast("error", "Choisissez les options");
        return;
      }
    }

    setLoadingCart(true);

    const data = {
      productTitle: product.name,
      image: product.images?.[0] || "",
      price: effectivePrice,
      oldPrice: product.oldPrice,
      discount: product.discount,
      productId: product._id,
      quantity,
      userId: user._id,
      rating: product.rating,
      countInStock: effectiveStock,
      brand: product.brand,

      // Ancien système (toujours envoyé pour rétrocompatibilité, vide si
      // le nouveau système de variantes est utilisé)
      size: selectedSize,
      color: selectedColor,
      ram: selectedRam,
      weight: selectedWeight,

      sizeOptions: product.size || [],
      colorOptions: product.colors || [],
      ramOptions: product.productRam || [],
      weightOptions: product.productWeight || [],

      // ✅ NOUVEAU
      selectedVariants: product.hasVariants ? selectedVariants : {},
    };

    postData("/api/cart/add", data).then((res) => {
      setLoadingCart(false);
      if (res?.success) {
        openToast("success", "Produit ajouté");
        loadCartItems();
      } else {
        openToast("error", res?.message);
      }
    });
  };

    const handleUpdateCart = () => {
    if (!currentCartItem?._id) return;

    // ✅ On vérifie le stock de la NOUVELLE sélection avant d'envoyer,
    // pour donner un retour immédiat sans attendre la réponse serveur.
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
    }

    if (effectiveStock <= 0) {
      openToast("error", "Ce produit (ou cette variante) est en rupture de stock");
      return;
    }

    setLoadingCart(true);

    editData("/api/cart/update-qty", {
      _id: currentCartItem._id,
      qty: quantity,
      size: selectedSize,
      color: selectedColor,
      ram: selectedRam,
      weight: selectedWeight,

      // ✅ NOUVEAU : permet de changer de variante sans supprimer/rajouter
      selectedVariants: product.hasVariants ? selectedVariants : undefined,
    }).then((res) => {
      setLoadingCart(false);
      if (res?.success) {
        openToast("success", "Panier mis à jour");
        loadCartItems();
      } else {
        openToast("error", res?.message || "Erreur lors de la mise à jour");
      }
    });
  };

  const handleIncrement = () => {
    if (!effectiveStock) return;
    setQuantity((q) => Math.min(q + 1, effectiveStock));
  };

  const handleDecrement = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  // FETCH PRODUIT
  const getProduct = async () => {
    try {
      const res = await fetchDataFromApi(`/api/product/${id}`);
      const data = res.product || res.data;
      setProduct(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    getProduct().finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const getReviewsCount = async () => {
      try {
        const res = await fetchDataFromApi(
          `/api/users/getReviews?productId=${id}`,
        );

        if (res?.success) {
          setReviewsCount(res.reviews.length);
        }
      } catch (err) {
        console.error(err);
      }
    };

    getReviewsCount();
  }, [id]);

  // INIT caractéristiques (ancien système)
  useEffect(() => {
    if (!product) return;

    if (product.size?.length > 0) setSelectedSize(product.size[0]);
    if (product.colors?.length > 0) setSelectedColor(product.colors[0]);
    if (product.productRam?.length > 0) setSelectedRam(product.productRam[0]);
    if (product.productWeight?.length > 0)
      setSelectedWeight(product.productWeight[0]);
  }, [product]);

  // ✅ NOUVEAU : présélectionne la première valeur de chaque type de
  // variante, pour que le client voie tout de suite un état valide
  // (comme le fait déjà l'ancien système ci-dessus).
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

  useEffect(() => {
    if (!product || !currentCartItem) return;

    setQuantity(currentCartItem.quantity);
    setSelectedSize(currentCartItem.size || null);
    setSelectedColor(currentCartItem.color || null);
    setSelectedRam(currentCartItem.ram || null);
    setSelectedWeight(currentCartItem.weight || null);

    // ✅ NOUVEAU : restaure la sélection de variantes depuis le panier
    if (currentCartItem.selectedVariants) {
      setSelectedVariants(currentCartItem.selectedVariants);
    }
  }, [product, currentCartItem]);

  const handleSelectVariant = (variantName, value) => {
    setSelectedVariants((prev) => ({ ...prev, [variantName]: value }));
    setQuantity(1); // évite de garder une quantité invalide en changeant de variante
  };

  return (
    <section className="productdetails">
      {/* BREADCRUMB */}
      {!loading && product && (
        <div className="container1">
          <nav className="breadcrumbs">
            <ul>
              <li>
                <a href="/">Accueil</a>
              </li>
              <li>
                <Link
                  to={`/productlisting?catId=${product.catId?._id || product.catId}`}
                >
                  {product.catName}
                </Link>
              </li>
              <li className="active">{product.name}</li>
            </ul>
          </nav>
        </div>
      )}

      {/* MAIN */}
      <div className="container2">
        {loading && (
          <div className="loader-wrapper">
            <CircularProgress />
          </div>
        )}

        {!loading && product && (
          <>
            {/* IMAGE */}
            <div className="productzoomcont">
              <ProductZoom images={product?.images || []} />
            </div>
            {/* INFOS */}
            <div className="productcont">
              <h2 className="product-title">{product.name}</h2>

              {/* BRAND + RATING */}
              {(product.brand || product.rating > 0) && (
  <div className="brand-rating">
    {product.brand && <span className="brand">Brand: {product.brand}</span>}

    {product.rating > 0 && (
      <div className="rating">
        {[...Array(5)].map((_, i) => (
          i < product.rating ? (
            <FaStar key={i} className="star-filled" size={16} />
          ) : (
            <FaRegStar key={i} className="star-empty" size={16} />
          )
        ))}
        <span className="reviews">({reviewsCount} avis)</span>
      </div>
    )}
  </div>
)}

              {/* PRICE */}
              <div className="price-stock">
                {product.oldPrice > 0 && (
  <span className="old-price">{product.oldPrice} FCFA</span>
)}
                <span className="price">{effectivePrice} FCFA</span>

                <span
                  className={`stock ${effectiveStock > 0 ? "in-stock" : "out-of-stock"}`}
                >
                  {effectiveStock > 0
                    ? `En stock (${effectiveStock} disponible${effectiveStock > 1 ? "s" : ""})`
                    : "Rupture de stock"}
                </span>
              </div>

              {/* DESCRIPTION */}
              {product.description && (
                <p className="desc">{product.description}</p>
              )}

              {/* ✅ NOUVEAU : sélecteurs de variantes génériques */}
              {product.hasVariants && product.variants?.length > 0 && (
                <div className="characteristics">
                  {product.variants.map((variant) => (
                    <div className="option-group" key={variant.name}>
                      <span className="option-label">{variant.name}:</span>
                      {variant.values.map((value, i) => (
                        <button
                          key={i}
                          className={`option-btn ${
                            selectedVariants[variant.name] === value
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            handleSelectVariant(variant.name, value)
                          }
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* OPTIONS (ancien système, affiché seulement si le produit
                  n'utilise PAS le nouveau système de variantes) */}
              {!product.hasVariants && (
                <div className="characteristics">
                  {product.size?.length > 0 && (
                    <div className="option-group">
                      <span className="option-label">Size:</span>
                      {product.size.map((size, i) => (
                        <button
                          key={i}
                          className={`option-btn ${size === selectedSize ? "active" : ""}`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  )}

                  {product.colors?.length > 0 && (
                    <div className="option-group">
                      <span className="option-label">Colors:</span>
                      {product.colors.map((color, i) => (
                        <button
                          key={i}
                          className={`option-btn ${color === selectedColor ? "active" : ""}`}
                          style={{ backgroundColor: color.toLowerCase() }}
                          onClick={() => setSelectedColor(color)}
                        >
                          {color === selectedColor ? "✓" : ""}
                        </button>
                      ))}
                    </div>
                  )}

                  {product.productRam?.length > 0 && (
                    <div className="option-group">
                      <span className="option-label">RAM:</span>
                      {product.productRam.map((ram, i) => (
                        <button
                          key={i}
                          className={`option-btn ${ram === selectedRam ? "active" : ""}`}
                          onClick={() => setSelectedRam(ram)}
                        >
                          {ram}
                        </button>
                      ))}
                    </div>
                  )}

                  {product.productWeight?.length > 0 && (
                    <div className="option-group">
                      <span className="option-label">Weight:</span>
                      {product.productWeight.map((w, i) => (
                        <button
                          key={i}
                          className={`option-btn ${w === selectedWeight ? "active" : ""}`}
                          onClick={() => setSelectedWeight(w)}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* sélection dynamique */}
                  <div className="selected-characteristics">
                    {[selectedSize, selectedColor, selectedRam, selectedWeight]
                      .filter(Boolean)
                      .join(" | ")}
                  </div>
                </div>
              )}

              {/* QUANTITY */}
              <div className="cart-actions">
                <div className="quantity">
                  <button onClick={handleDecrement} disabled={!effectiveStock}>
                    -
                  </button>
                  <span>{quantity}</span>
                  <button onClick={handleIncrement} disabled={!effectiveStock}>
                    +
                  </button>
                </div>
                <button
                  className="add-cart"
                  onClick={currentCartItem ? handleUpdateCart : handleAddToCart}
                  disabled={loadingCart || !effectiveStock}
                >
                  {loadingCart ? (
                    <CircularProgress />
                  ) : (
                    <>
                      <FaCartPlus />
                      {currentCartItem ? "Mettre à jour" : "Ajouter au panier"}
                    </>
                  )}
                </button>
              </div>
              {/* ACTIONS */}
              <div className="extra-actions">
                <button className="wishlist">
                  <FaHeart /> Favoris
                </button>

                <button className="compare">
                  <FaBalanceScale /> Comparer
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* TABS */}
      {!loading && product && (
        <div className="product-tabs">
          <div className="tabs-header">
            {[
              "Description",
              "Informations supplémentaires",
              `Avis (${reviewsCount})`,
            ].map((tab, index) => (
              <button
                key={index}
                className={`tab-btn ${activeTab === index ? "active" : ""}`}
                onClick={() => setActiveTab(index)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="tabs-content">
            {activeTab === 0 && (
              <div className="tab-description">
                <p>{product.description}</p>
              </div>
            )}

            {activeTab === 1 && (
              <div className="tab-info">
                <table>
                  <tbody>
                    {/* IDENTITÉ PRODUIT */}
                    <tr>
                      <th>Nom</th>
                      <td>{product.name}</td>
                    </tr>

                    <tr>
                      <th>Marque</th>
                      <td>{product.brand}</td>
                    </tr>

                    <tr>
                      <th>Catégorie</th>
                      <td>{product.catName}</td>
                    </tr>

                    <tr>
                      <th>Sous-catégorie</th>
                      <td>{product.subCat || "-"}</td>
                    </tr>

                    {/* PRIX */}
                    <tr>
                      <th>Prix</th>
                      <td>{effectivePrice} FCFA</td>
                    </tr>

                    <tr>
                      <th>Ancien prix</th>
                      <td>{product.oldPrice || "-"}</td>
                    </tr>

                    <tr>
                      <th>Réduction</th>
                      <td>{product.discount || 0}%</td>
                    </tr>

                    {/* STOCK */}
                    <tr>
                      <th>Stock</th>
                      <td
                        className={
                          effectiveStock > 0
                            ? "in-stock"
                            : "out-of-stock"
                        }
                      >
                        {effectiveStock > 0
                          ? `${effectiveStock} disponible(s)`
                          : "Rupture de stock"}
                      </td>
                    </tr>

                    {/* ✅ NOUVEAU : variantes génériques */}
                    {product.hasVariants &&
                      product.variants?.map((variant) => (
                        <tr key={variant.name}>
                          <th>{variant.name}</th>
                          <td>{variant.values.join(", ")}</td>
                        </tr>
                      ))}

                    {/* VARIANTES (ancien système, affiché seulement si le
                        nouveau n'est pas utilisé) */}
                    {!product.hasVariants && product.size?.length > 0 && (
                      <tr>
                        <th>Tailles</th>
                        <td>{product.size.join(", ")}</td>
                      </tr>
                    )}

                    {!product.hasVariants && product.colors?.length > 0 && (
                      <tr>
                        <th>Couleurs</th>
                        <td>{product.colors.join(", ")}</td>
                      </tr>
                    )}

                    {!product.hasVariants && product.productRam?.length > 0 && (
                      <tr>
                        <th>RAM</th>
                        <td>{product.productRam.join(", ")}</td>
                      </tr>
                    )}

                    {!product.hasVariants && product.productWeight?.length > 0 && (
                      <tr>
                        <th>Poids</th>
                        <td>{product.productWeight.join(", ")}</td>
                      </tr>
                    )}

                    {/* DATES */}
                    <tr>
                      <th>Date création</th>
                      <td>
                        {product.createdAt
                          ? new Date(product.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 2 && (
              <Reviews
                product={product}
                user={user}
                setReviewsCount={setReviewsCount}
              />
            )}
          </div>
        </div>
      )}

      {/* SIMILAR PRODUCTS */}
      <div className="similairecont">
        <h2>Produits similaires</h2>
        {product && <ProductSlider categoryId={product.catId} />}
      </div>
    </section>
  );
};

export default ProductDetails;