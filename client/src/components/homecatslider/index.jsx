import React, { useRef, useEffect, useState } from "react";
import "./homecatslider.scss";
import { fetchDataFromApi } from "../../pages/utils/api";
import { CategorySkeleton } from "../CategorySkeleton/CategorySkeleton.jsx";
import { Link } from "react-router-dom";

const HomeCatSlider = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  // 🔹 Fetch catégories
  useEffect(() => {
    fetchDataFromApi("/api/category?perPage=100")
      .then((res) => {
        if (res.error === false) {
          setCategories(res?.data);
        }
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  // 🔹 Scroll amélioré (slide par bloc)
  const scroll = (direction) => {
    const container = sliderRef.current;
    const scrollAmount = container.offsetWidth * 0.8;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // 🔹 Drag à la souris (UX PRO 🔥)
  useEffect(() => {
    const slider = sliderRef.current;
    let isDown = false;
    let startX;
    let scrollLeft;

    const startDrag = (e) => {
      isDown = true;
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };

    const stopDrag = () => {
      isDown = false;
    };

    const moveDrag = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2; // vitesse
      slider.scrollLeft = scrollLeft - walk;
    };

    slider.addEventListener("mousedown", startDrag);
    slider.addEventListener("mouseleave", stopDrag);
    slider.addEventListener("mouseup", stopDrag);
    slider.addEventListener("mousemove", moveDrag);

    return () => {
      slider.removeEventListener("mousedown", startDrag);
      slider.removeEventListener("mouseleave", stopDrag);
      slider.removeEventListener("mouseup", stopDrag);
      slider.removeEventListener("mousemove", moveDrag);
    };
  }, []);

  const mainCategories = categories.filter((cat) => !cat.parentId);

  return (
    <section className="home-cat-slider">
      <button className="slider-btn left" onClick={() => scroll("left")}>
        ‹
      </button>

      <div className="cat-container" ref={sliderRef}>
        {loading ? (
          <div style={{ display: "flex", gap: "16px" }}>
            <CategorySkeleton count={9} />
          </div>
        ) : mainCategories.length > 0 ? (
          mainCategories.map((cat) => (
            <Link
              key={cat._id}
              to={`/productlisting?catId=${cat._id}`}
              className="cat-card"
            >
              <img src={cat.images?.[0] || "/default-cat.jpg"} alt={cat.name} />
              <div className="cat-name">{cat.name}</div>
            </Link>
          ))
        ) : (
          <p className="empty-msg">Aucune catégorie trouvée</p>
        )}
      </div>

      <button className="slider-btn right" onClick={() => scroll("right")}>
        ›
      </button>
    </section>
  );
};

export default HomeCatSlider;
