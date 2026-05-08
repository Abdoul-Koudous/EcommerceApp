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

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetchDataFromApi(`/api/product/${id}`);
      if (!res?.error) setProduct(res.product);
      setLoading(false);
    };
    fetchProduct();
  }, [id]);
    // 🔹 Affichage du loader tant que le produit charge
    if (loading)
        return (
        <div className="loading-container">
            <CircularProgress />
        </div>
        );

  if (!product) return <p>Produit introuvable</p>;

  return (
    <div className="product-details">
      <div className="header">
        <h2>Détails du produit</h2>
        <Link to="/products/lists" className="back-btn">← Retour</Link>
      </div>

      <div className="details-content">
        {/* Images à gauche */}
        <div className="images">
          <ProductZoom images={product.images} />
        </div>

        {/* Infos à droite */}
        <div className="info">
            <h3 className="title">{product.name}</h3>
          <div className="meta-list">
            <div className="meta-item">
                <FaBuilding className="icon" />
                <span className="label">Marque </span>
                   <span className="colon">:</span>
                <span className="value">{product.brand}</span>
            </div>
            <div className="meta-item">
                <FaTag className="icon" />
                <span className="label">Catégorie </span>
                   <span className="colon">:</span>
                <span className="value">{product.catName}</span>
            </div>
            <div className="meta-item">
                <FaListAlt className="icon" />
                <span className="label">Sous-catégorie </span>
                   <span className="colon">:</span>
                <span className="value">{product.subCat || "—"}</span>
            </div>
            <div className="meta-item">
                <FaPercent className="icon" />
                <span className="label">Promotion </span>
                   <span className="colon">:</span>
                <span className="value">{product.sale}%</span>
            </div>
            <div className="meta-item">
                <FaMemory className="icon" />
                <span className="label">RAM </span>
                   <span className="colon">:</span>
                <span className="value">{product.productRam?.join(" , ") || "—"}</span>
            </div>
            <div className="meta-item">
                <FaRuler className="icon" />
                <span className="label">Taille </span>
                   <span className="colon">:</span>
                <span className="value">{product.size?.join(" , ") || "—"}</span>
            </div>
            <div className="meta-item">
                <FaWeightHanging className="icon" />
                <span className="label">Poids </span>
                   <span className="colon">:</span>
                <span className="value">{product.productWeight?.join(" , ") || "—"}</span>
            </div>
            <div className="meta-item">
                <FaCalendarAlt className="icon" />
                <span className="label">Publié le </span>
                   <span className="colon">:</span>
                {new Date(product.dateCreated).toLocaleString()} 
            </div>
            <div className="meta-item">
                <FaStar className="icon" />
                <span className="label">Avis </span>
                   <span className="colon">:</span>
                <span className="value">({product.rating}) avis</span>
            </div>
            </div>

            {/* Description sur toute la largeur en bas */}
            <div className="description">
                <h3>Description</h3>
                <p>{product.description}</p>
            </div>

        </div>
      </div>

       <h4>Avis clients</h4>


        {/* Liste des avis */}
          <div className="reviews-list">
           

            {[
              {
                name: "Jean Dupont",
                date: "25 Octobre 2025",
                comment: `Super produit, très bonne qualité ! 
                Je le recommande vivement. 
                pour les amateurs de technologie. on peut l'utiliser pour
                 diverses tâches et il fonctionne parfaitement.`,
                rating: 5,
                img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCzK6DKnIE7MM_7cuaQAJlpxUHYs8yKDT3yg&s",
              },
              {
                name: "Awa Diop",
                date: "22 Octobre 2025",
                comment: "Bon rapport qualité-prix, livraison rapide.",
                rating: 4,
                img: "https://www.amity.edu/gurugram/microbackoffice/Uploads/TestimonialImage/98testi_RajivBasavaalumni.jpg",
              },
              {
                name: "Awa Diop",
                date: "22 Octobre 2025",
                comment: "Bon rapport qualité-prix, livraison rapide.",
                rating: 4,
                img: "https://www.amity.edu/gurugram/microbackoffice/Uploads/TestimonialImage/98testi_RajivBasavaalumni.jpg",
              },
              {
                name: "Awa Diop",
                date: "22 Octobre 2025",
                comment: "Bon rapport qualité-prix, livraison rapide.",
                rating: 4,
                img: "https://www.amity.edu/gurugram/microbackoffice/Uploads/TestimonialImage/98testi_RajivBasavaalumni.jpg",
              },
              {
                name: "Awa Diop",
                date: "22 Octobre 2025",
                comment: "Bon rapport qualité-prix, livraison rapide.",
                rating: 4,
                img: "https://www.amity.edu/gurugram/microbackoffice/Uploads/TestimonialImage/98testi_RajivBasavaalumni.jpg",
              },
              {
                name: "Awa Diop",
                date: "22 Octobre 2025",
                comment: "Bon rapport qualité-prix, livraison rapide.",
                rating: 4,
                img: "https://www.amity.edu/gurugram/microbackoffice/Uploads/TestimonialImage/98testi_RajivBasavaalumni.jpg",
              },
            ].map((review, i) => (
              <div className="review-item" key={i}>
                <img src={review.img} alt={review.name} className="review-avatar" />

                <div className="review-content">
                  <h5>{review.name}</h5>
                  <span className="review-date">{review.date}</span>
                  <p>{review.comment}</p>
                </div>

                <div className="review-rating">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </div>
              </div>
            ))}
          </div>
      
    </div>
  );
};

export default ProductDetails;
