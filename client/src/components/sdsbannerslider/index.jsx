import React, { useRef } from 'react';
import BannerBox from '../bannerbox';
import "./adsbannerslider.scss";

const AdsBannerSlider = ({ items = 3 }) => {
  // Tableau complet des bannières
  const banners = [
    "https://www.jiomart.com/images/cms/aw_rbslider/slides/1760377346_Celebrate_Diwali.jpg?im=Resize=(632,804)",
    "https://www.jiomart.com/images/cms/aw_rbslider/slides/1759745377_HPMC_Hindi_new.jpg?im=Resize=(632,804)",
    "https://www.jiomart.com/images/cms/aw_rbslider/slides/1760377381_Utensils_Storage_Dhanteras_HPMC_01.jpg?im=Resize=(632,804)",
    "https://ma.jumia.is/cms/000_2025/000010_October/TeasingBlackFriday/SX.gif",
    "https://ma.jumia.is/cms/000_2025/000010_October/ADS/Adidas/SX.jpg",
  ];

  // On garde seulement le nombre voulu d’items
  const visibleBanners = banners.slice(0, items);

  const sliderRef = useRef(null);

  const scrollLeft = () => {
    sliderRef.current.scrollBy({ left: -400, behavior: "smooth" });
  };

  const scrollRight = () => {
    sliderRef.current.scrollBy({ left: 400, behavior: "smooth" });
  };

  return (
    <section className="ads-banner-slider">
      <button className="banner-btn left" onClick={scrollLeft}>‹</button>

      <div className="banner-container" ref={sliderRef}>
        {visibleBanners.map((img, index) => (
          <BannerBox key={index} img={img} />
        ))}
      </div>

      <button className="banner-btn right" onClick={scrollRight}>›</button>
    </section>
  );
};

export default AdsBannerSlider;
