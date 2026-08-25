import React from "react";
import { Link } from "react-router-dom";
import { FaShippingFast, FaUndoAlt, FaGift, FaHeadset, FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import "./footer.scss";

const Footer = () => {
  return (
    <footer className="ft-footer">
      {/* Section des icônes en haut */}
      <div className="ft-top">
        <div className="ft-top-item">
          <FaShippingFast className="ft-icon"/>
          <span>Livraison gratuite</span>
          <p>Rapide & fiable</p>
        </div>
        <div className="ft-top-item">
          <FaUndoAlt className="ft-icon"/>
          <span>Retour 30 jours</span>
          <p>Facile & simple</p>
        </div>
        <div className="ft-top-item">
          <FaGift className="ft-icon"/>
          <span>Cadeaux spéciaux</span>
          <p>Pour vous</p>
        </div>
        <div className="ft-top-item">
          <FaHeadset className="ft-icon"/>
          <span>Support 24/7</span>
          <p>Toujours là</p>
        </div>
      </div>

      <hr />

      {/* Section des colonnes */}
      <div className="ft-bottom">
        <div className="ft-column">
          <h4>Nous contacter</h4>
          <p>Email : contact@monsite.com</p>
          <p>Téléphone : +229 123 456 78</p>
          <p>Adresse : Cotonou, Bénin</p>
        </div>

        <div className="ft-column">
          <h4>Produits</h4>
          <ul>
            <li><Link to="/productlisting">Nouveaux produits</Link></li>
            <li><Link to="/productlisting">Boutique</Link></li>
            <li><Link to="/productlisting">Promotions</Link></li>
            <li><Link to="/productlisting">Meilleures ventes</Link></li>
          </ul>
        </div>

        <div className="ft-column">
          <h4>Notre compagnie</h4>
          <ul>
            <li><Link to="/about">À propos de nous</Link></li>
            <li><Link to="/contact">Nous contacter</Link></li>
          </ul>
        </div>
      </div>

      <hr />

      {/* Section finale : réseaux sociaux, copyright, paiement */}
      <div className="ft-end">
        <div className="ft-socials">
          <a href="#" className="ft-social"><FaFacebookF /></a>
          <a href="#" className="ft-social"><FaInstagram /></a>
          <a href="#" className="ft-social"><FaTwitter /></a>
          <a href="#" className="ft-social"><FaLinkedinIn /></a>
        </div>

        <p className="ft-copy">
          © {new Date().getFullYear()} <strong>YebouShop</strong> — Tous droits réservés.
        </p>

        <div className="ft-payments">
          <img src="https://logos-world.net/wp-content/uploads/2020/05/Visa-Logo.png" alt="Visa" />
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkzpbskcw38f0FCjHYQaIlxTv6vc2myE0GBQ&s" alt="MasterCard" />
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrJdjso_lcyN_0SmKZH4T0LwvUKVms39KghA&s" alt="PayPal" />
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP7IDLhhgwF0FiAVhWTC5RIQgj4zoiFjJ5m4iJV_nY2WqCCq8_T499AA9J&s=10" alt="Moov" />
          <img src="https://upload.wikimedia.org/wikipedia/fr/thumb/e/e9/Mtn-logo-svg.svg/3840px-Mtn-logo-svg.svg.png?utm_source=fr.wikipedia.org&utm_campaign=index&utm_content=thumbnail" alt="MTN" />
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgi-zVk5ohj_wx54ges-qW_yM9L9tNebaD-hp1Uj0IGvy4sx-P4SkN21MP&s=10" alt="Celtiis" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;