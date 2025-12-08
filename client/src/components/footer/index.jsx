import React from "react";
import { FaShippingFast, FaUndoAlt, FaGift, FaHeadset, FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import "./footer.scss";

const Footer = () => {
  return (
    <footer className="footer">
      {/* Section des icônes en haut */}
      <div className="footer-top">
        <div className="footer-top-item">
          <FaShippingFast className="footer-icon"/>
          <span>Livraison gratuite</span>
          <p>Rapide & fiable</p>
        </div>
        <div className="footer-top-item">
          <FaUndoAlt className="footer-icon"/>
          <span>Retour 30 jours</span>
          <p>Facile & simple</p>
        </div>
        <div className="footer-top-item">
          <FaGift className="footer-icon"/>
          <span>Cadeaux spéciaux</span>
          <p>Pour vous</p>
        </div>
        <div className="footer-top-item">
          <FaHeadset className="footer-icon"/>
          <span>Support 24/7</span>
          <p>Toujours là</p>
        </div>
      </div>

      <hr />

      {/* Section des colonnes */}
      <div className="footer-bottom">
        <div className="footer-column">
          <h4>Nous contacter</h4>
          <p>Email : contact@monsite.com</p>
          <p>Téléphone : +229 123 456 78</p>
          <p>Adresse : Cotonou, Bénin</p>
        </div>

        <div className="footer-column">
          <h4>Produits</h4>
          <ul>
            <li><a href="#">Nouveaux produits</a></li>
            <li><a href="#">Boutique</a></li>
            <li><a href="#">Promotions</a></li>
            <li><a href="#">Meilleures ventes</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Notre compagnie</h4>
          <ul>
            <li><a href="#">À propos de nous</a></li>
            <li><a href="#">Politique de confidentialité</a></li>
            <li><a href="#">Conditions d'utilisation</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Abonnez-vous</h4>
          <p>Recevez nos dernières offres</p>
          <form>
            <input type="email" placeholder="Votre email" />
            <div className="checkbox">
              <input type="checkbox" id="agree" />
              <label htmlFor="agree">J'accepte les conditions</label>
            </div>
            <button type="submit">S'abonner</button>
          </form>
        </div>
      </div>

      <hr />

      {/* Section finale : réseaux sociaux, copyright, paiement */}
      <div className="footer-end">
        <div className="footer-socials">
          <a href="#" className="social"><FaFacebookF /></a>
          <a href="#" className="social"><FaInstagram /></a>
          <a href="#" className="social"><FaTwitter /></a>
          <a href="#" className="social"><FaLinkedinIn /></a>
        </div>

        <p className="footer-copy">
          © {new Date().getFullYear()} <strong>YebouShop</strong> — Tous droits réservés.
        </p>

        <div className="footer-payments">
          <img src="https://logos-world.net/wp-content/uploads/2020/05/Visa-Logo.png" alt="Visa" />
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkzpbskcw38f0FCjHYQaIlxTv6vc2myE0GBQ&s" alt="MasterCard" />
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrJdjso_lcyN_0SmKZH4T0LwvUKVms39KghA&s" alt="PayPal" />
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
