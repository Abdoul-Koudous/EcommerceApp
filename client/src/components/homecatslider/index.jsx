import React, { useRef } from "react";
import "./homecatslider.scss";

const HomeCatSlider = () => {
  const categories = [
    { name: "Électronique", image: "https://cdn.pixabay.com/photo/2015/01/21/14/14/apple-606761_1280.jpg" },
    { name: "Beauté & Soins", image: "https://media.istockphoto.com/id/1408439145/fr/photo/soin-dautomne-et-concept-de-maquillage-dautomne-avec-des-produits-de-beaut%C3%A9-sur-table.jpg?s=612x612&w=0&k=20&c=HykZYDSmfbmdMsGnsQHMJMjAXlE-r9L-2-FLAlady1g=" },
    { name: "Maison", image: "https://cdn.pixabay.com/photo/2016/11/18/17/20/living-room-1835923_1280.jpg" },
    { name: "Cuisine", image: "https://www.but-cuisines.fr/medias/images/hero/hero-signature.jpg" },
    { name: "Mode", image: "https://sindivestuario.org.br/wp-content/uploads/2019/05/Imagem-cabides.jpg" },
    { name: "Sport", image: "https://img.freepik.com/photos-gratuite/outils-sport_53876-138077.jpg?ga=GA1.1.309038061.1731491808&semt=ais_hybrid&w=740&q=80" },
    { name: "Accessoirs Bébé", image: "https://previews.123rf.com/images/luplupme/luplupme2009/luplupme200900004/154829117-baby-care-objects-newborn-accessories-vector-illustrations-set-cute-scrapbook-for-girl-with-baby.jpg" },
    
  ];

  const sliderRef = useRef(null);

  const scrollLeft = () => {
    sliderRef.current.scrollBy({ left: -180, behavior: "smooth" });
  };

  const scrollRight = () => {
    sliderRef.current.scrollBy({ left: 180, behavior: "smooth" });
  };

  return (
    <section className="home-cat-slider">
      <button className="slider-btn left" onClick={scrollLeft}>‹</button>
      <div className="cat-container" ref={sliderRef}>
        {categories.map((cat, index) => (
          <div key={index} className="cat-card">
            <img src={cat.image} alt={cat.name} />
            <div className="cat-name">{cat.name}</div>
          </div>
        ))}
      </div>
      <button className="slider-btn right" onClick={scrollRight}>›</button>
    </section>
  );
};

export default HomeCatSlider;
