import React, { useRef, useState } from "react";
import "./popularTabs.scss";

const PopularTabs = () => {
  const [activeTab, setActiveTab] = useState("electronique");
  const scrollRef = useRef(null);

  const categories = [
    { id: "electronique", label: "Électronique" },
    { id: "mode", label: "Mode" },
    { id: "maison", label: "Maison" },
    { id: "beaute", label: "Beauté" },
    { id: "sport", label: "Sport" },
    { id: "jeux", label: "Jeux" },
    { id: "cuisine", label: "Cuisine" },
    { id: "sante", label: "Santé" },
  ];

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
  };

  return (
    <div className="popular-tabs">
      <div className="slider-wrapper">
        <button className="scroll-btn left" onClick={scrollLeft}>
          ❮
        </button>

        <div className="tabs-slider" ref={scrollRef}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`tab-item ${activeTab === cat.id ? "active" : ""}`}
              onClick={() => setActiveTab(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button className="scroll-btn right" onClick={scrollRight}>
          ❯
        </button>
      </div>
    </div>
  );
};

export default PopularTabs;
