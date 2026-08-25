import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaCheck } from "react-icons/fa";
import "./homeslider.scss";
import { fetchDataFromApi } from "../../pages/utils/api";

const AUTOPLAY_MS = 5000;
const LONG_PRESS_MS = 400;

// 4 signatures d'entrée différentes, appliquées en boucle selon l'index du slide.
// Chaque slide garde toujours la même variante (pas d'aléatoire = pas de flash au reload).
const ENTRY_VARIANTS = ["rise", "slide-left", "slide-right", "zoom"];

const HomeSlider = () => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const touchTimerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDataFromApi("/api/homeSlide").then((res) => {
      if (res?.data) {
        setSlides(
          res.data.map((item) => ({
            id: item._id,
            image: item.images?.[0],
            title: item.title,
            subtitle: item.subtitle,
            badgeText: item.badgeText,
            badgeColor: item.badgeColor || "accent",
            highlights: item.highlights || [],
            ctaText: item.ctaText || "Découvrir",
            ctaLink: item.ctaLink,
          }))
        );
      }
    });
  }, []);

  const goTo = useCallback(
    (index) => {
      if (!slides.length) return;
      setCurrent(((index % slides.length) + slides.length) % slides.length);
    },
    [slides.length]
  );

  const nextSlide = useCallback(() => goTo(current + 1), [current, goTo]);
  const prevSlide = useCallback(() => goTo(current - 1), [current, goTo]);

  // Autoplay
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    timerRef.current = setInterval(nextSlide, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [isPaused, slides.length, nextSlide]);

  const handleManualChange = (action) => {
    clearInterval(timerRef.current);
    action();
  };

  // Pause desktop (survol) — le bouton reste cliquable normalement
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Pause mobile (appui long) — un tap simple ne déclenche pas la pause
  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => setIsPaused(true), LONG_PRESS_MS);
  };
  const handleTouchEnd = () => {
    clearTimeout(touchTimerRef.current);
    setIsPaused(false);
  };

  const handleCtaClick = (link) => {
    if (!link) return;
    if (/^https?:\/\//.test(link)) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      navigate(link);
    }
  };

  if (!slides.length) return <div className="home-slider home-slider--empty" />;

  return (
    <div
      className="home-slider"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {slides.map((slide, index) => {
        const isActive = index === current;
        const variant = ENTRY_VARIANTS[index % ENTRY_VARIANTS.length];

        return (
          <div
            key={slide.id}
            className={`slide ${isActive ? "active" : ""}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="slide__scrim" />

            {/*
              La clé change à chaque fois que ce slide redevient actif
              (active-0, active-1, active-2...) → React remonte le bloc,
              ce qui relance l'animation d'entrée en cascade au lieu
              de rester figé à opacity:1 depuis le montage initial.
            */}
            <div
              key={isActive ? `active-${current}` : "idle"}
              className={`content content--${variant}`}
            >
              {slide.badgeText && (
                <span className={`badge badge--${slide.badgeColor}`}>
                  {slide.badgeText}
                </span>
              )}

              {slide.title && <h2 className="title">{slide.title}</h2>}

              {slide.subtitle && <p className="subtitle">{slide.subtitle}</p>}

              {slide.highlights.length > 0 && (
                <ul className="highlights">
                  {slide.highlights.map((h, i) => (
                    <li key={i}>
                      <FaCheck aria-hidden="true" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}

              {slide.ctaLink && (
                <button
                  className="cta"
                  onClick={() => handleCtaClick(slide.ctaLink)}
                >
                  {slide.ctaText}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <button
            className="nav-btn prev"
            aria-label="Slide précédent"
            onClick={() => handleManualChange(prevSlide)}
          >
            <FaChevronLeft />
          </button>

          <button
            className="nav-btn next"
            aria-label="Slide suivant"
            onClick={() => handleManualChange(nextSlide)}
          >
            <FaChevronRight />
          </button>

          <div className="progress">
            {slides.map((_, idx) => (
              <button
                key={idx}
                className="progress__segment"
                aria-label={`Aller au slide ${idx + 1}`}
                onClick={() => handleManualChange(() => goTo(idx))}
              >
                <span
                  className={`progress__fill ${
                    idx === current ? "is-active" : ""
                  } ${idx === current && isPaused ? "is-paused" : ""} ${
                    idx < current ? "is-done" : ""
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HomeSlider;