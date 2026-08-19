import React, { useState, useEffect, useContext } from "react";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock } from "react-icons/fa";
import { fetchDataFromApi, postData } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import "./contact.scss";

const Contact = () => {
  const { openToast } = useContext(ToastContext);

  const [pageData, setPageData] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchDataFromApi("/api/contact-page").then((res) => {
      if (res?.success) {
        setPageData(res.data);
      }
      setLoadingPage(false);
    });
  }, []);

  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      openToast("error", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSending(true);

    postData("/api/contact-message/send", formData)
      .then((res) => {
        if (res?.success) {
          openToast("success", res?.message || "Message envoyé avec succès");
          setFormData({ name: "", email: "", subject: "", message: "" });
        } else {
          openToast("error", res?.message || "Erreur lors de l'envoi");
        }
      })
      .catch(() => {
        openToast("error", "Erreur serveur, réessayez plus tard");
      })
      .finally(() => setSending(false));
  };

  // ✅ Construit l'URL de la carte : priorité aux coordonnées GPS, sinon la requête texte
  const getMapSrc = () => {
    if (!pageData) return null;
    if (pageData.mapLat && pageData.mapLng) {
      return `https://www.google.com/maps?q=${pageData.mapLat},${pageData.mapLng}&output=embed`;
    }
    if (pageData.mapQuery) {
      return `https://www.google.com/maps?q=${encodeURIComponent(pageData.mapQuery)}&output=embed`;
    }
    return null;
  };

  if (loadingPage) {
    return <div className="contact-page__loading">Chargement...</div>;
  }

  const mapSrc = getMapSrc();

  return (
    <section className="contact-page">
      {/* HERO */}
      <div
        className="contact-hero"
        style={pageData?.heroImage ? { backgroundImage: `url(${pageData.heroImage})` } : undefined}
      >
        <div className="overlay"></div>
        <div className="hero-content">
          {pageData?.heroTag && <p className="tag">{pageData.heroTag}</p>}
          {pageData?.heroTitle && <h1>{pageData.heroTitle}</h1>}
          {pageData?.heroSubtitle && <p className="subtitle">{pageData.heroSubtitle}</p>}
        </div>
      </div>

      <div className="container contact-body">
        {/* INFOS */}
        <div className="contact-info">
          {pageData?.address && (
            <div className="info-card">
              <FaMapMarkerAlt className="icon" />
              <div>
                <h4>Adresse</h4>
                <p>{pageData.address}</p>
              </div>
            </div>
          )}
          {pageData?.phone && (
            <div className="info-card">
              <FaPhoneAlt className="icon" />
              <div>
                <h4>Téléphone</h4>
                <p>{pageData.phone}</p>
              </div>
            </div>
          )}
          {pageData?.email && (
            <div className="info-card">
              <FaEnvelope className="icon" />
              <div>
                <h4>Email</h4>
                <p>{pageData.email}</p>
              </div>
            </div>
          )}
          {pageData?.hours && (
            <div className="info-card">
              <FaClock className="icon" />
              <div>
                <h4>Horaires</h4>
                <p>{pageData.hours}</p>
              </div>
            </div>
          )}
        </div>

        {/* FORM */}
        <form className="contact-form" onSubmit={onSubmit}>
          <h3>Envoyez-nous un message</h3>

          <div className="form-row">
            <input
              type="text"
              name="name"
              placeholder="Votre nom *"
              value={formData.name}
              onChange={onChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Votre email *"
              value={formData.email}
              onChange={onChange}
            />
          </div>

          <input
            type="text"
            name="subject"
            placeholder="Sujet"
            value={formData.subject}
            onChange={onChange}
          />

          <textarea
            name="message"
            rows="6"
            placeholder="Votre message *"
            value={formData.message}
            onChange={onChange}
          />

          <button className="btn-primary" disabled={sending}>
            {sending ? "Envoi..." : "Envoyer le message"}
          </button>
        </form>
      </div>

      {/* MAP */}
      {mapSrc && (
        <div className="contact-map">
          <iframe
            title="Notre localisation"
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      )}
    </section>
  );
};

export default Contact;