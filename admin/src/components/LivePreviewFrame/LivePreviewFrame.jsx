import React, { useRef, useEffect, useState } from "react";
import "./livepreviewframe.scss";

const DESIGN_WIDTH = 1280;

const LivePreviewFrame = ({ children }) => {
  const outerRef = useRef(null);
  const scalerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [naturalHeight, setNaturalHeight] = useState(0);

  useEffect(() => {
    const updateScale = () => {
      if (outerRef.current) {
        const containerWidth = outerRef.current.offsetWidth;
        if (containerWidth > 0) {
          setScale(containerWidth / DESIGN_WIDTH);
        }
      }
    };

    updateScale();

    // ✅ recalcule aussi après le premier rendu complet (layout grid stabilisé)
    const timeout = setTimeout(updateScale, 100);

    // ✅ observe les changements de taille du conteneur lui-même (pas seulement window resize)
    const resizeObserver = new ResizeObserver(updateScale);
    if (outerRef.current) resizeObserver.observe(outerRef.current);

    window.addEventListener("resize", updateScale);

    return () => {
      clearTimeout(timeout);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setNaturalHeight(entry.target.scrollHeight);
      }
    });
    if (scalerRef.current) ro.observe(scalerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className="live-preview-frame"
      ref={outerRef}
      style={{ height: naturalHeight * scale }}
    >
      <div
        className="live-preview-frame__scaler"
        ref={scalerRef}
        style={{ transform: `scale(${scale})`, width: DESIGN_WIDTH }}
      >
        {children}
      </div>
    </div>
  );
};

export default LivePreviewFrame;