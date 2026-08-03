import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchDataFromApi } from "../utils/api";
import "./productDetails.scss";
import ProductZoom from "../../components/productzoom";
import { FaTag, FaBuilding, FaListAlt, FaPercent, FaMemory, FaRuler, FaWeightHanging, FaCalendarAlt, FaStar } from "react-icons/fa";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetchDataFromApi(`/api/product/${id}`);
      if (!res?.error) setProduct(res.product);
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  // ✅ récupère les vrais avis du produit depuis le backend
  // (même endpoint public utilisé côté client)
  useEffect(() => {
    const fetchReviews = async () => {
      setReviewsLoading(true);

      const res = await fetchDataFromApi(`/api/users/getReviews?productId=${id}`);

      if (res?.success) {
        const sorted = (res?.reviews || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setReviews(sorted);
      }

      setReviewsLoading(false);
    };

    if (id) fetchReviews();
  }, [id]);

  if (loading)
    return (
      <div className="pdt-loading-container">
        <CircularProgress />
      </div>
    );

  if (!product) return <p>Produit introuvable</p>;

  return (
    <div className="pdt-page">
      <div className="pdt-header">
        <h2>Détails du produit</h2>
        <Link to="/products/lists" className="pdt-back-btn">← Retour</Link>
      </div>

      <div className="pdt-details-content">
        <div className="pdt-images">
          <ProductZoom images={product.images} />
        </div>

        <div className="pdt-info">
          <h3 className="pdt-title">{product.name}</h3>
          <div className="pdt-meta-list">
            <div className="pdt-meta-item">
              <FaBuilding className="icon" />
              <span className="label">Marque </span>
              <span className="colon">:</span>
              <span className="value">{product.brand}</span>
            </div>
            <div className="pdt-meta-item">
              <FaTag className="icon" />
              <span className="label">Catégorie </span>
              <span className="colon">:</span>
              <span className="value">{product.catName}</span>
            </div>
            <div className="pdt-meta-item">
              <FaListAlt className="icon" />
              <span className="label">Sous-catégorie </span>
              <span className="colon">:</span>
              <span className="value">{product.subCat || "—"}</span>
            </div>
            <div className="pdt-meta-item">
              <FaPercent className="icon" />
              <span className="label">Promotion </span>
              <span className="colon">:</span>
              <span className="value">{product.sale}%</span>
            </div>
            <div className="pdt-meta-item">
              <FaMemory className="icon" />
              <span className="label">RAM </span>
              <span className="colon">:</span>
              <span className="value">{product.productRam?.join(" , ") || "—"}</span>
            </div>
            <div className="pdt-meta-item">
              <FaRuler className="icon" />
              <span className="label">Taille </span>
              <span className="colon">:</span>
              <span className="value">{product.size?.join(" , ") || "—"}</span>
            </div>
            <div className="pdt-meta-item">
              <FaWeightHanging className="icon" />
              <span className="label">Poids </span>
              <span className="colon">:</span>
              <span className="value">{product.productWeight?.join(" , ") || "—"}</span>
            </div>
            <div className="pdt-meta-item">
              <FaCalendarAlt className="icon" />
              <span className="label">Publié le </span>
              <span className="colon">:</span>
              {new Date(product.dateCreated).toLocaleString()}
            </div>
            <div className="pdt-meta-item">
              <FaStar className="icon" />
              <span className="label">Avis </span>
              <span className="colon">:</span>
              {/* ✅ reflète le vrai nombre d'avis chargés, plus product.rating
                 qui était trompeur ici (c'était une note, pas un compteur) */}
              <span className="value">{reviews.length} avis</span>
            </div>
          </div>

          <div className="pdt-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      <div className="pdt-reviews-list">
        <h4>Avis clients ({reviews.length})</h4>

        {reviewsLoading ? (
          <div className="pdt-reviews-loading">
            <CircularProgress />
          </div>
        ) : reviews.length === 0 ? (
          <p className="pdt-no-reviews">Aucun avis pour ce produit.</p>
        ) : (
          reviews.map((review) => {
            const formattedDate = review.createdAt
              ? new Date(review.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "—";

            return (
              <div className="pdt-review-item" key={review._id}>
                <img
                  src={review.image || "/user.jpg"}
                  alt={review.userName}
                  className="pdt-review-avatar"
                />

                <div className="pdt-review-content">
                  <h5>{review.userName}</h5>
                  <span className="pdt-review-date">{formattedDate}</span>
                  <p>{review.review}</p>
                </div>

                <div className="pdt-review-rating">
                  {"★".repeat(Number(review.rating) || 0)}
                  {"☆".repeat(5 - (Number(review.rating) || 0))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProductDetails;