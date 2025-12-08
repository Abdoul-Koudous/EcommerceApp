import React, { useState, useRef, useEffect } from "react";
import "./productzoom.scss";

const ProductZoom = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [showZoom, setShowZoom] = useState(false);
  const zoomRef = useRef(null);
  const bgPosRef = useRef("center");

  // Précharge les images pour éviter les flashs
  useEffect(() => {
    images.forEach((img) => {
      const image = new Image();
      image.src = img;
    });
  }, [images]);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    bgPosRef.current = `${x}% ${y}%`;
    if (zoomRef.current) {
      requestAnimationFrame(() => {
        zoomRef.current.style.backgroundPosition = bgPosRef.current;
      });
    }
  };

  return (
    <div className="zoom-wrapper">
      <div className="thumbnails">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt="miniature"
            className={selectedImage === img ? "active" : ""}
            onClick={() => setSelectedImage(img)}
          />
        ))}
      </div>

      <div
        className="main-image"
        onMouseEnter={() => setShowZoom(true)}
        onMouseLeave={() => setShowZoom(false)}
        onMouseMove={handleMouseMove}
      >
        <img src={selectedImage} alt="produit" />
        {/* Zoom superposé */}
        <div
          className={`zoom-display ${showZoom ? "visible" : ""}`}
          ref={zoomRef}
          style={{ backgroundImage: `url(${selectedImage})` }}
        ></div>
      </div>
    </div>
  );
};

export default ProductZoom;
