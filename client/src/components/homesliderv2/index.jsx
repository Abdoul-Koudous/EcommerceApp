import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { fetchDataFromApi } from "../../pages/utils/api";
import "./homesliderv2.scss";

const HomeBannerV2 = () => {
  const [bannerProducts, setBannerProducts] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const longPressTimer = useRef(null);
  const navigate = useNavigate();

  // 🔹 Récupération des produits à afficher dans la bannière
  useEffect(() => {
    const fetchBannerProducts = async () => {
      setLoading(true);
      try {
        const res = await fetchDataFromApi("/api/product/getAllProducts");
        const products = res.products || res.data || [];
        const filtered = products.filter((p) => p.isDisplayOnHomeBanner);
        setBannerProducts(filtered);
      } catch (err) {
        console.error(err);
        setBannerProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBannerProducts();
  }, []);

  // 🔹 Défilement automatique — suspendu tant que isPaused est vrai
  useEffect(() => {
    if (bannerProducts.length === 0 || isPaused) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bannerProducts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [bannerProducts, isPaused]);

  // 🔹 Nettoyage du timer d'appui long si le composant se démonte
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  // 🔹 Petits écrans / tactile : appui long sur le slide (pas juste le
  // bouton) met en pause. Court appui = tap normal (ex: navigation).
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsPaused(true);
    }, 400);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsPaused(false);
  };

  const nextSlide = () =>
    setCurrent((prev) => (prev + 1) % bannerProducts.length);
  const prevSlide = () =>
    setCurrent(
      (prev) => (prev - 1 + bannerProducts.length) % bannerProducts.length
    );

  if (loading) return <p>Chargement des produits...</p>;
  if (bannerProducts.length === 0) return <p>Aucun produit en bannière.</p>;

  const currentSlide = bannerProducts[current];

  // 🔹 Même destination que le clic sur une carte produit (ProductItem)
  const goToProduct = () => navigate(`/product/${currentSlide._id}`);

  return (
    <div className="home-banner-v2">
      <button className="nav-btn left" onClick={prevSlide}>
        <FaArrowLeft />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide._id}
          className="slide"
          style={{
            backgroundImage: `url(${currentSlide.bannerimages?.[0] || "/placeholder.jpg"})`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="slide-content">
            <motion.p
              key={`title-${currentSlide._id}`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {currentSlide.bannerTitleName}
            </motion.p>

            <motion.h2
              key={`name-${currentSlide._id}`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              {currentSlide.name}
            </motion.h2>

            

            {/* 🔹 Prix affiché à part */}
            <motion.div
              className="slide-price"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
            >
              <span className="slide-price-text">Commencer avec seulement </span>
              <h3 className="slide-price-value">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "XOF",
                }).format(currentSlide.price)}
              </h3>
            </motion.div>

            {/* ✅ Bouton original, maintenant cliquable vers la page produit */}
            <motion.button
              className="slide-btn"
              onClick={goToProduct}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.6 }}
            >
              Découvrir maintenant
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      <button className="nav-btn right" onClick={nextSlide}>
        <FaArrowRight />
      </button>
    </div>
  );
};

export default HomeBannerV2;