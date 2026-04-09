import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { fetchDataFromApi } from "../../pages/utils/api";
import "./homesliderv2.scss";

const HomeBannerV2 = () => {
  const [bannerProducts, setBannerProducts] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

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

  // 🔹 Défilement automatique
  useEffect(() => {
    if (bannerProducts.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bannerProducts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [bannerProducts]);

  const nextSlide = () =>
    setCurrent((prev) => (prev + 1) % bannerProducts.length);
  const prevSlide = () =>
    setCurrent(
      (prev) => (prev - 1 + bannerProducts.length) % bannerProducts.length
    );

  if (loading) return <p>Chargement des produits...</p>;
  if (bannerProducts.length === 0) return <p>Aucun produit en bannière.</p>;

  const currentSlide = bannerProducts[current];

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
        >
          <div className="slide-content">
            <motion.p
              key={currentSlide.bannerTitleName}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {currentSlide.bannerTitleName}
            </motion.p>

            <motion.h2
              key={currentSlide.name}
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

            {/* ✅ Bouton original */}
            <motion.button
              className="slide-btn"
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