import React, { useState, useContext, useEffect } from 'react'
import { UserContext } from '../../UserContext/UserContext';
import { FaStar, FaRegStar } from "react-icons/fa";
import { fetchDataFromApi, postData } from '../utils/api';
import { ToastContext } from '../../context/ToastContext';

export const Reviews = ({ product, user, setReviewsCount }) => {
  const [selectedRating, setSelectedRating] = useState(0);
  const { openToast } = useContext(ToastContext);

  const [formData, setFormData] = useState({
    image: '',
    userName: '',
    review: '',
    rating: '',
    userId: '',
    productId: ''
  });

  const [reviewsList, setReviewsList] = useState([]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      image: user?.avatar || '',
      userName: user?.name || '',
      userId: user?._id || '',
      productId: product?._id || '',
    }));
  }, [user, product]);

  const onChangeInput = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const addReview = (e) => {
    e.preventDefault();

    if (selectedRating === 0) {
      openToast("error", "Veuillez sélectionner une note");
      return;
    }

    if (!formData.review.trim()) {
      openToast("error", "Le commentaire est vide");
      return;
    }

    const payload = {
      ...formData,
      rating: selectedRating,
    };

    postData("/api/users/addReview", payload)
      .then((res) => {
        if (res?.success) {
          openToast("success", res?.message);

          setFormData((prev) => ({
            ...prev,
            review: '',
          }));

          setSelectedRating(0);

          getReviews();
        } else {
          openToast("error", res?.message);
        }
      })
      .catch((err) => {
        openToast("error", err?.message || "Erreur serveur");
      });
  };

  const getReviews = () => {
    fetchDataFromApi(`/api/users/getReviews?productId=${product?._id}`)
      .then((res) => {
        if (res?.success) {
          const sortedReviews = (res?.reviews || []).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );

          setReviewsList(sortedReviews);

          // ✅ MAJ DU COUNT ICI
          if (typeof setReviewsCount === "function") {
            setReviewsCount(sortedReviews.length);
          }
        } else {
          openToast("error", res?.message);
        }
      })
      .catch((err) => {
        openToast("error", err?.message || "Erreur serveur");
      });
  };

  useEffect(() => {
    if (product?._id) {
      getReviews();
    }
  }, [product]);

  return (
    <div className="tab-reviews">
      {/* Formulaire d'avis */}
      <form className="review-form" onSubmit={addReview}>
        <h4>Laisser un avis</h4>

        {/* Champs Nom + Email */}
        <div className="form-row">
          <input type="text" placeholder="Votre nom" />
          <input type="email" placeholder="Votre email" />
        </div>

        {/* Champ commentaire */}
        <textarea
          placeholder="Votre commentaire..."
          rows="4"
          onChange={onChangeInput}
          name="review"
          value={formData.review}
        />
        {/* Étoiles interactives */}
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setSelectedRating(star)}
              className="star-icon"
              style={{ cursor: "pointer" }}
            >
              {star <= selectedRating ? (
                <FaStar className="star-filled" />
              ) : (
                <FaRegStar className="star-empty" />
              )}
            </span>
          ))}
        </div>

        {/* Checkbox */}
        <div className="save-info">
          <input type="checkbox" id="save-info" />
          <label htmlFor="save-info">
            Enregistrer mon nom et mon email pour les prochains commentaires.
          </label>
        </div>

        <button className="btn-submit">Soumettre</button>
      </form>

      {/* Liste des avis */}
      <div className="reviews-list">
        <h4>{reviewsList.length} avis</h4>

        {reviewsList.map((review, i) => {

          // ✅ FORMAT DATE
          const formattedDate = new Date(review.createdAt).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
          });

          return (
            <div className="review-item" key={i}>
              <img
                src={review.image}
                alt={review.userName}
                className="review-avatar"
              />

              <div className="review-content">
                <h5>{review.userName}</h5>
                <span className="review-date">{formattedDate}</span>
                <p>{review.review}</p>
              </div>

              <div className="review-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  star <= Number(review.rating) ? (
                    <FaStar key={star} className="star-filled" />
                  ) : (
                    <FaRegStar key={star} className="star-empty" />
                  )
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
export default Reviews