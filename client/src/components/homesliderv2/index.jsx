import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import BannerBoxv2 from "../bannerboxv2";
import "./homesliderv2.scss";


const slides = [
  {
    id: 1,
    image:
      "https://sindivestuario.org.br/wp-content/uploads/2019/05/Imagem-cabides.jpg",
    title: "Nouvelle Collection Été",
    subtitle: "Découvrez nos tendances exclusives",
    button: "Découvrir maintenant",
  },
  {
    id: 2,
    image:
      "https://cdn.pixabay.com/photo/2015/01/21/14/14/apple-606761_1280.jpg",
    title: "Électronique de qualité",
    subtitle: "La technologie au meilleur prix",
    button: "Voir les produits",
  },
  {
    id: 3,
    image:
      "https://media.istockphoto.com/id/1408439145/fr/photo/soin-dautomne-et-concept-de-maquillage-dautomne-avec-des-produits-de-beaut%C3%A9-sur-table.jpg?s=612x612&w=0&k=20&c=HykZYDSmfbmdMsGnsQHMJMjAXlE-r9L-2-FLAlady1g=",
    title: "Mode & Accessoires",
    subtitle: "Exprimez votre style unique",
    button: "Acheter maintenant",
  },
];

const HomeBannerV2 = () => {
  const [current, setCurrent] = useState(0);

  // défilement automatique
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <>
    <div className="home-banner-v2">
      <button className="nav-btn left" onClick={prevSlide}>
        <FaArrowLeft />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={slides[current].id}
          className="slide"
          style={{
            backgroundImage: `url(${slides[current].image})`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* ✅ Texte par-dessus l’image */}
          <div className="slide-content">
            <motion.h2
              key={slides[current].title}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {slides[current].title}
            </motion.h2>

            <motion.p
              key={slides[current].subtitle}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              {slides[current].subtitle}
            </motion.p>

            <motion.button
              className="slide-btn"
              key={slides[current].button}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.6 }}
            >
              {slides[current].button}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      <button className="nav-btn right" onClick={nextSlide}>
        <FaArrowRight />
      </button>
    </div>
    </>
  );
};

export default HomeBannerV2;
