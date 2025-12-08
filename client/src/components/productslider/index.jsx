import React, { useRef } from "react";
import ProductItem from "../productitem";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./productslider.scss";

const ProductSlider = () => {
  const scrollRef = useRef(null);

  const products = [
    {
      image1: "/od11.jpg",
      image2: "/od12.jpg",
      title: "Montre connectée Pro",
      desc: "Montre intelligente avec capteur cardiaque",
      price: "15000",
      oldPrice: "20000",
      discount: "25",
      rating: 5,
      isNew: true,
    },
    {
      image1: "/od21.jpg",
      image2: "/od22.jpg",
      title: "Écouteurs Bluetooth X10",
      desc: "Autonomie 24h avec boîtier de charge",
      price: "10000",
      oldPrice: "12000",
      discount: "17",
      rating: 4,
      isNew: true,
    },
    {
      image1: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
      image2: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=627",
      title: "Smartphone Galaxy Z",
      desc: "128 Go, double SIM, écran HD",
      price: "85000",
      oldPrice: "95000",
      discount: "11",
      rating: 5,
    },
    {
      image1: "/od12.jpg",
      image2: "/od13.jpg",
      title: "Ordinateur Portable HP",
      desc: "Core i5, 8 Go RAM, SSD 512 Go",
      price: "250000",
      oldPrice: "280000",
      discount: "11",
      rating: 5,
    },
    {
      image1: "/od32.jpg",
      image2: "/od31.jpg",
      title: "Casque Audio ProBass",
      desc: "Son clair et basse profonde",
      price: "30000",
      oldPrice: "35000",
      discount: "14",
      rating: 4,
    },
     {
      image1: "/od32.jpg",
      image2: "/od31.jpg",
      title: "Casque Audio ProBass",
      desc: "Son clair et basse profonde",
      price: "30000",
      oldPrice: "35000",
      discount: "14",
      rating: 4,
    },
     {
      image1: "/od32.jpg",
      image2: "/od31.jpg",
      title: "Casque Audio ProBass",
      desc: "Son clair et basse profonde",
      price: "30000",
      oldPrice: "35000",
      discount: "14",
      rating: 4,
    },
  ];

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  return (
    <div className="product-slider-wrapper">
      <button className="scroll-btn left" onClick={scrollLeft}>
        <FaChevronLeft />
      </button>

      <div className="product-slider" ref={scrollRef}>
        {products.map((p, i) => (
          <ProductItem key={i} {...p} />
        ))}
      </div>

      <button className="scroll-btn right" onClick={scrollRight}>
        <FaChevronRight />
      </button>
    </div>
  );
};

export default ProductSlider;
