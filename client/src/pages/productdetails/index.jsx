import { Link, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";

import "./productdetail.scss";
import { FaStar, FaHeart, FaCartPlus, FaBalanceScale } from "react-icons/fa";
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

  // caractéristiques dynamiques (comme popup)
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedRam, setSelectedRam] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(null);

  const [activeTab, setActiveTab] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  const { user, cartItems, loadCartItems } = useContext(UserContext);
  const { openToast } = useContext(ToastContext);

  const currentCartItem = cartItems?.find(
    (item) => item.productId === product?._id,
  );

  const handleAddToCart = () => {
    if (!user?._id) {
      openToast("error", "Veuillez vous connecter");
      return;
    }

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

    setLoadingCart(true);

    const data = {
      productTitle: product.name,
      image: product.images?.[0] || "",
      price: product.price,
      oldPrice: product.oldPrice,
      discount: product.discount,
      productId: product._id,
      quantity,
      userId: user._id,
      rating: product.rating,
      countInStock: product.countIntStock,
      brand: product.brand,

      size: selectedSize,
      color: selectedColor,
      ram: selectedRam,
      weight: selectedWeight,

      sizeOptions: product.size || [],
      colorOptions: product.colors || [],
      ramOptions: product.productRam || [],
      weightOptions: product.productWeight || [],
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

    if (!product?.countIntStock || product.countIntStock <= 0) {
      openToast("error", "Ce produit est en rupture de stock");
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
    }).then((res) => {
      setLoadingCart(false);
      if (res?.success) {
        openToast("success", "Panier mis à jour");
        loadCartItems();
      }
    });
  };

  const handleIncrement = () => {
    if (!product?.countIntStock) return;
    setQuantity((q) => Math.min(q + 1, product.countIntStock));
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

  // INIT caractéristiques (comme popup)
  useEffect(() => {
    if (!product) return;

    if (product.size?.length > 0) setSelectedSize(product.size[0]);
    if (product.colors?.length > 0) setSelectedColor(product.colors[0]);
    if (product.productRam?.length > 0) setSelectedRam(product.productRam[0]);
    if (product.productWeight?.length > 0)
      setSelectedWeight(product.productWeight[0]);
  }, [product]);

  useEffect(() => {
    if (!product || !currentCartItem) return;

    setQuantity(currentCartItem.quantity);
    setSelectedSize(currentCartItem.size || null);
    setSelectedColor(currentCartItem.color || null);
    setSelectedRam(currentCartItem.ram || null);
    setSelectedWeight(currentCartItem.weight || null);
  }, [product, currentCartItem]);

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
              <div className="brand-rating">
                <span className="brand">Brand: {product.brand}</span>

                <div className="rating">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      color={i < product.rating ? "#FFD700" : "#ccc"}
                      size={16}
                    />
                  ))}
                  <span className="reviews">({reviewsCount} avis)</span>
                </div>
              </div>

              {/* PRICE */}
              <div className="price-stock">
                {product.oldPrice && (
                  <span className="old-price">{product.oldPrice} FCFA</span>
                )}
                <span className="price">{product.price} FCFA</span>

                <span
                  className={`stock ${product.countIntStock > 0 ? "in-stock" : "out-of-stock"}`}
                >
                  {product.countIntStock > 0
                    ? `En stock (${product.countIntStock} disponible${product.countIntStock > 1 ? "s" : ""})`
                    : "Rupture de stock"}
                </span>
              </div>

              {/* DESCRIPTION */}
              {product.description && (
                <p className="desc">{product.description}</p>
              )}

              {/* OPTIONS (comme popup) */}
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

              {/* QUANTITY */}
              <div className="cart-actions">
                <div className="quantity">
                  <button onClick={handleDecrement} disabled={!product.countIntStock}>
                    -
                  </button>
                  <span>{quantity}</span>
                  <button onClick={handleIncrement} disabled={!product.countIntStock}>
                    +
                  </button>
                </div>
                <button
                  className="add-cart"
                  onClick={currentCartItem ? handleUpdateCart : handleAddToCart}
                  disabled={loadingCart || !product.countIntStock}
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
                      <td>{product.price} FCFA</td>
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
                          product.countIntStock > 0
                            ? "in-stock"
                            : "out-of-stock"
                        }
                      >
                        {product.countIntStock > 0
                          ? `${product.countIntStock} disponible(s)`
                          : "Rupture de stock"}
                      </td>
                    </tr>

                    {/* VARIANTES */}
                    {product.size?.length > 0 && (
                      <tr>
                        <th>Tailles</th>
                        <td>{product.size.join(", ")}</td>
                      </tr>
                    )}

                    {product.colors?.length > 0 && (
                      <tr>
                        <th>Couleurs</th>
                        <td>{product.colors.join(", ")}</td>
                      </tr>
                    )}

                    {product.productRam?.length > 0 && (
                      <tr>
                        <th>RAM</th>
                        <td>{product.productRam.join(", ")}</td>
                      </tr>
                    )}

                    {product.productWeight?.length > 0 && (
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