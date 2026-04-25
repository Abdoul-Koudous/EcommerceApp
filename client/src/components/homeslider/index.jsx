import React, { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./homeslider.scss";
import { fetchDataFromApi } from "../../pages/utils/api";

const HomeSlider = () => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const timerRef = useRef(null);

  // 🔥 FETCH DATA
  useEffect(() => {
    fetchDataFromApi("/api/homeSlide").then((res) => {
      if (res?.data) {
        // 🔥 transformer les données
        const formattedSlides = res.data.map((item, index) => ({
          id: item._id,
          image: item.images?.[0], // ⚠️ on prend la 1ère image
        }));

        setSlides(formattedSlides);
      }
    });
  }, []);

  const nextSlide = () =>
    setCurrent((prev) => (prev + 1) % slides.length);

  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  // autoplay
  useEffect(() => {
    if (autoPlay && slides.length > 0) {
      timerRef.current = setInterval(nextSlide, 5000);
    }

    return () => clearInterval(timerRef.current);
  }, [autoPlay, slides]);

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

          {/* 🔥 tu peux remettre du contenu si tu veux */}
          <div className="content">
            <h2>Promotion</h2>
            <p>Découvrez nos offres</p>
            <button>Decouvrir mainntenant</button>
          </div>
        </div>
      ))}

      {/* Navigation */}
      <button className="prev" onClick={() => handleManualChange(prevSlide)}>
        <FaChevronLeft />
      </button>

      <button className="next" onClick={() => handleManualChange(nextSlide)}>
        <FaChevronRight />
      </button>

      {/* Dots */}
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