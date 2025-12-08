import React, { useState } from "react";
import "./productdetail.scss";
import { FaStar, FaHeart, FaCartPlus, FaBalanceScale } from "react-icons/fa";
import ProductZoom from "../../components/productzoom";
import ProductSlider from "../../components/productslider";

const ProductDetails = () => {
  // Exemple de données du produit
  const product = {
    id: 1,
    title: "Ordinateur connectée Pro",
    brand: "ProBrand",
    desc: "Ordinateur intelligente avec capteur cardiaque, waterproof, autonomie 7 jours.",
    price: 15000,
    oldPrice: 20000,
    rating: 5,
    reviews: 12,
    stock: true,
    category: "Électronique",
    size: "M",
    colors: ["Black", "Blue"],
    material: "Silicone",
    shippingDays: 3,
    images: [
      "/od11.jpg",
      "/od12.jpg",
      "/od13.jpg",
      "/od21.jpg",
      "/od22.jpg",
      "/od31.jpg",
      "/od32.jpg",
    ],
  };

  const [quantity, setQuantity] = useState(1);
  const handleIncrement = () => setQuantity(quantity + 1);
  const handleDecrement = () => setQuantity(quantity > 1 ? quantity - 1 : 1);
  const [selectedSize, setSelectedSize] = useState("M");
    const [selectedColor, setSelectedColor] = useState(product.colors[0]);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedRating, setSelectedRating] = useState(0);




  return (
    <section className="productdetails">
      {/* Fil d’Ariane */}
      <div className="container1">
        <nav className="breadcrumbs">
          <ul>
            <li><a href="/">Accueil</a></li>
            <li><a href="/categorie">{product.category}</a></li>
            <li className="active">{product.title}</li>
          </ul>
        </nav>
      </div>

      {/* Contenu principal */}
      <div className="container2">
        {/* Zoom + miniatures */}
        <div className="productzoomcont">
          <ProductZoom images={product.images} />
        </div>

        {/* Détails du produit */}
        <div className="productcont">
          {/* 1️⃣ Titre */}
          <h2 className="product-title">{product.title}</h2>

          {/* 2️⃣ Brand + étoiles + reviews */}
          <div className="brand-rating">
            <span className="brand">Brand: {product.brand}</span>
            <div className="rating">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} color={i < product.rating ? "#FFD700" : "#ccc"} size={16} />
              ))}
              <span className="reviews">({product.reviews} reviews)</span>
            </div>
          </div>

          {/* 3️⃣ Prix + disponibilité */}
          <div className="price-stock">
            {product.oldPrice && <span className="old-price">{product.oldPrice} FCFA</span>}
            <span className="price">{product.price} FCFA</span>
            <span className="stock">{product.stock ? "In stock" : "Out of stock"}</span>
          </div>

          {/* 4️⃣ Description courte */}
          <p className="desc">{product.desc}</p>

          {/* 5️⃣ Caractéristiques sélectionnables */}
                <div className="characteristics">
                {/* Taille */}
                <div className="option-group">
                    <span className="option-label">Size:</span>
                    {["S", "M", "L", "XL"].map((size) => (
                    <button
                        key={size}
                        className={`option-btn ${size === selectedSize ? "active" : ""}`}
                        onClick={() => setSelectedSize(size)}
                    >
                        {size}
                    </button>
                    ))}
                </div>

                {/* Couleur */}
                <div className="option-group">
                    <span className="option-label">Colors:</span>
                    {product.colors.map((color) => (
                    <button
                        key={color}
                        className={`option-btn ${color === selectedColor ? "active" : ""}`}
                        style={{ backgroundColor: color.toLowerCase() }}
                        onClick={() => setSelectedColor(color)}
                    >
                        {color === selectedColor ? "✓" : ""}
                    </button>
                    ))}
                </div>
                </div>


          {/* 6️⃣ Free shipping */}
          <div className="shipping">Free shipping: {product.shippingDays} days</div>

          {/* 7️⃣ Compteur + Ajouter au panier */}
          <div className="cart-actions">
            <div className="quantity">
              <button onClick={handleDecrement}>-</button>
              <span>{quantity}</span>
              <button onClick={handleIncrement}>+</button>
            </div>
            <button className="add-to-cart">
              <FaCartPlus /> Ajouter au panier
            </button>
          </div>

          {/* 8️⃣ Favoris + Comparer */}
          <div className="extra-actions">
            <button className="wishlist">
              <FaHeart /> Ajouter aux favoris
            </button>
            <button className="compare">
              <FaBalanceScale /> Add to compare
            </button>
          </div>
        </div>
      </div>
      {/* 9️⃣ Bloc Tabs */}
        <div className="product-tabs">
        {/* Tabs header */}
        <div className="tabs-header">
            {["Description", "Informations supplémentaires", `Avis (${product.reviews})`].map(
            (tab, index) => (
                <button
                key={index}
                className={`tab-btn ${activeTab === index ? "active" : ""}`}
                onClick={() => setActiveTab(index)}
                >
                {tab}
                </button>
            )
            )}
        </div>

        {/* Tabs content */}
      <div className="tabs-content">
        {/* 🟩 Onglet 1 : Description */}
        {activeTab === 0 && (
          <div className="tab-description">
            <p>{product.desc}</p>
          </div>
        )}

        {/* 🟦 Onglet 2 : Informations supplémentaires */}
        {activeTab === 1 && (
          <div className="tab-info">
            <table>
              <tbody>
                <tr>
                  <th>Taille</th>
                  <td>{selectedSize}</td>
                </tr>
                <tr>
                  <th>Couleur</th>
                  <td>{selectedColor}</td>
                </tr>
                <tr>
                  <th>Matériau</th>
                  <td>{product.material}</td>
                </tr>
                <tr>
                  <th>Marque</th>
                  <td>{product.brand}</td>
                </tr>
                <tr>
                  <th>Poids</th>
                  <td>{product.weight || "1.2 kg"}</td>
                </tr>
                <tr>
                  <th>Garantie</th>
                  <td>{product.warranty || "6 mois"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 🟥 Onglet 3 : Avis */}
        {activeTab === 2 && (
        <div className="tab-reviews">
          {/* Formulaire d’avis */}
          <div className="review-form">
            <h4>Laisser un avis</h4>

            {/* Champs Nom + Email */}
            <div className="form-row">
              <input type="text" placeholder="Votre nom" />
              <input type="email" placeholder="Votre email" />
            </div>

            {/* Champ commentaire */}
            <textarea placeholder="Votre commentaire..." rows="4"></textarea>

            {/* Étoiles interactives */}
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= selectedRating ? "active" : ""}`}
                  onClick={() => setSelectedRating(star)}
                >
                  ★
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
          </div>

          {/* Liste des avis */}
          <div className="reviews-list">
            <h4>{product.reviews} avis</h4>

            {[
              {
                name: "Jean Dupont",
                date: "25 Octobre 2025",
                comment: "Super produit, très bonne qualité !",
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
      )}

          </div>

              </div>

              <div className="similairecont">
                  <h2>Produits similaires</h2>
                  <ProductSlider/>
              </div>

    </section>
  );
};

export default ProductDetails;
