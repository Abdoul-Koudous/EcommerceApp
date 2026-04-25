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