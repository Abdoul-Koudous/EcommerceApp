import React, { useState, useRef, useEffect } from "react";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./productzoom.scss";

const ProductZoom = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [showZoom, setShowZoom] = useState(false);
  const zoomRef = useRef(null);
  const bgPosRef = useRef("center");

  // === Visualiseur plein écran (lightbox) ===
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);

  // Précharge les images pour éviter les flashs
  useEffect(() => {
    images.forEach((img) => {
      const image = new Image();
      image.src = img;
    });
  }, [images]);

  // Bloque le scroll de la page pendant que le visualiseur est ouvert
  useEffect(() => {
    if (viewerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [viewerOpen]);

  // Navigation clavier (desktop)
  useEffect(() => {
    if (!viewerOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setViewerOpen(false);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewerOpen, viewerIndex]);

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

  const openViewer = () => {
    const startIndex = images.indexOf(selectedImage);
    setViewerIndex(startIndex >= 0 ? startIndex : 0);
    setViewerOpen(true);
  };

  const goNext = () => {
    setViewerIndex((i) => Math.min(i + 1, images.length - 1));
  };

  const goPrev = () => {
    setViewerIndex((i) => Math.max(i - 1, 0));
  };

  // === Balayage tactile ===
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const onTouchMove = (e) => {
    if (!isDragging) return;
    setDragX(e.touches[0].clientX - touchStartX.current);
  };

  const onTouchEnd = () => {
    const threshold = 50;
    if (dragX < -threshold) goNext();
    else if (dragX > threshold) goPrev();
    setDragX(0);
    setIsDragging(false);
  };

  return (
    <div className="pz-wrapper">
      <div className="pz-thumbnails">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt="miniature"
            className={selectedImage === img ? "pz-active" : ""}
            onClick={() => setSelectedImage(img)}
          />
        ))}
      </div>

      <div
        className="pz-main"
        onMouseEnter={() => setShowZoom(true)}
        onMouseLeave={() => setShowZoom(false)}
        onMouseMove={handleMouseMove}
        onClick={openViewer}
      >
        <img src={selectedImage} alt="produit" />
        {/* Zoom superposé (desktop uniquement) */}
        <div
          className={`pz-zoom-display ${showZoom ? "pz-visible" : ""}`}
          ref={zoomRef}
          style={{ backgroundImage: `url(${selectedImage})` }}
        ></div>
      </div>

      {/* === VISUALISEUR PLEIN ÉCRAN === */}
      {viewerOpen && (
        <div className="pz-viewer-overlay" onClick={() => setViewerOpen(false)}>
          <button
            className="pz-viewer-close"
            onClick={(e) => {
              e.stopPropagation();
              setViewerOpen(false);
            }}
          >
            <FaTimes />
          </button>

          {images.length > 1 && (
            <button
              className="pz-viewer-arrow pz-viewer-arrow-left"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              disabled={viewerIndex === 0}
            >
              <FaChevronLeft />
            </button>
          )}

          <div
            className="pz-viewer-track-cont"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="pz-viewer-track"
              style={{
                transform: `translateX(calc(-${viewerIndex * 100}% + ${dragX}px))`,
                transition: isDragging ? "none" : "transform 0.3s ease",
              }}
            >
              {images.map((img, i) => (
                <div className="pz-viewer-slide" key={i}>
                  <img src={img} alt={`produit-${i}`} draggable={false} />
                </div>
              ))}
            </div>
          </div>

          {images.length > 1 && (
            <button
              className="pz-viewer-arrow pz-viewer-arrow-right"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              disabled={viewerIndex === images.length - 1}
            >
              <FaChevronRight />
            </button>
          )}

          {images.length > 1 && (
            <div className="pz-viewer-footer" onClick={(e) => e.stopPropagation()}>
              <span className="pz-viewer-counter">
                {viewerIndex + 1} / {images.length}
              </span>
              <div className="pz-viewer-dots">
                {images.map((_, i) => (
                  <button
                    key={i}
                    className={`pz-viewer-dot ${i === viewerIndex ? "pz-active" : ""}`}
                    onClick={() => setViewerIndex(i)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductZoom;