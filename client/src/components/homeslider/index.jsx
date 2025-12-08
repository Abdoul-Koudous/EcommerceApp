import React, { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./homeslider.scss";

const slides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    title: "Promo sur l'électronique",
    subtitle: "Jusqu’à -40% sur les ordinateurs et accessoires",
    buttonText: "Découvrir",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1200&q=80",
    title: "Beauté & Bien-être",
    subtitle: "Prenez soin de vous avec nos produits de qualité",
    buttonText: "Acheter maintenant",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    title: "Maison & Cuisine",
    subtitle: "Des équipements modernes pour votre confort",
    buttonText: "Voir les offres",
  },
];

const HomeSlider = () => {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const timerRef = useRef(null);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  // Effet pour l’auto défilement
  useEffect(() => {
    if (autoPlay) {
      timerRef.current = setInterval(nextSlide, 5000);
    }

    return () => clearInterval(timerRef.current);
  }, [autoPlay]);

  // Fonction qui désactive l’autoplay quand on clique
  const handleManualChange = (action) => {
    clearInterval(timerRef.current);
    setAutoPlay(false);
    action();
  };

  return (
    <div className="home-slider">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`slide ${index === current ? "active" : ""}`}
          style={{
            backgroundImage: `url(${slide.image})`,
          }}
        >
          <div className="overlay"></div>
          <div className="content">
            <h2>{slide.title}</h2>
            <p>{slide.subtitle}</p>
            <button>{slide.buttonText}</button>
          </div>
        </div>
      ))}

      {/* Boutons de navigation */}
      <button className="prev" onClick={() => handleManualChange(prevSlide)}>
        <FaChevronLeft />
      </button>
      <button className="next" onClick={() => handleManualChange(nextSlide)}>
        <FaChevronRight />
      </button>

      {/* Petits points */}
      <div className="dots">
        {slides.map((_, idx) => (
          <span
            key={idx}
            className={idx === current ? "dot active" : "dot"}
            onClick={() => {
              clearInterval(timerRef.current);
              setAutoPlay(false);
              setCurrent(idx);
            }}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default HomeSlider;
