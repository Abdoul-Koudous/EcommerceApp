import React from "react";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock } from "react-icons/fa";
import "./contactpreview.scss";

const ContactPreview = ({ data }) => {
  const getMapSrc = () => {
    if (data.mapLat && data.mapLng) {
      return `https://www.google.com/maps?q=${data.mapLat},${data.mapLng}&output=embed`;
    }
    if (data.mapQuery) {
      return `https://www.google.com/maps?q=${encodeURIComponent(data.mapQuery)}&output=embed`;
    }
    return null;
  };

  const mapSrc = getMapSrc();

  return (
    <section className="contact-page">
      {/* HERO */}
      <div
        className="contact-hero"
        style={data.heroImage ? { backgroundImage: `url(${data.heroImage})` } : undefined}
      >
        <div className="overlay"></div>
        <div className="hero-content">
          {data.heroTag && <p className="tag">{data.heroTag}</p>}
          {data.heroTitle && <h1>{data.heroTitle}</h1>}
          {data.heroSubtitle && <p className="subtitle">{data.heroSubtitle}</p>}
        </div>
      </div>

      <div className="container contact-body">
        {/* INFOS */}
        <div className="contact-info">
          {data.address && (
            <div className="info-card">
              <FaMapMarkerAlt className="icon" />
              <div>
                <h4>Adresse</h4>
                <p>{data.address}</p>
              </div>
            </div>
          )}
          {data.phone && (
            <div className="info-card">
              <FaPhoneAlt className="icon" />
              <div>
                <h4>Téléphone</h4>
                <p>{data.phone}</p>
              </div>
            </div>
          )}
          {data.email && (
            <div className="info-card">
              <FaEnvelope className="icon" />
              <div>
                <h4>Email</h4>
                <p>{data.email}</p>
              </div>
            </div>
          )}
          {data.hours && (
            <div className="info-card">
              <FaClock className="icon" />
              <div>
                <h4>Horaires</h4>
                <p>{data.hours}</p>
              </div>
            </div>
          )}
        </div>

        {/* FORM */}
        <div className="contact-form">
          <h3>Envoyez-nous un message</h3>

          <div className="form-row">
            <input type="text" placeholder="Votre nom *" disabled />
            <input type="email" placeholder="Votre email *" disabled />
          </div>

          <input type="text" placeholder="Sujet" disabled />
          <textarea rows="6" placeholder="Votre message *" disabled />

          <button className="btn-primary" disabled>
            Envoyer le message
          </button>
        </div>
      </div>

      {/* MAP */}
      {mapSrc && (
        <div className="contact-map">
          <iframe
            title="Aperçu localisation"
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
          ></iframe>
        </div>
      )}
    </section>
  );
};

export default ContactPreview;