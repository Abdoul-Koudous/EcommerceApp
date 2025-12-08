import React from "react";
import "./bannerboxv2.scss";

const banners = [

  {
    id: 2,
    title: "Mode Homme",
    image:
      "https://images.unsplash.com/photo-1521336575822-6da63fb45455?auto=format&fit=crop&w=800&q=80",
    button: "Découvrir",
  },
  {
    id: 3,
    title: "Accessoires & Montres",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    button: "Acheter maintenant",
  },
];

const BannerBoxv2 = () => {
  return (
    <div className="banner-box-v2">
      {banners.map((banner) => (
        <div key={banner.id} className="banner-item">
          {/* ✅ image de fond dans un div séparé */}
          <div
            className="banner-bg"
            style={{ backgroundImage: `url(${banner.image})` }}
          ></div>

          {/* ✅ contenu texte par-dessus */}
          <div className="banner-content">
            <h2>{banner.title}</h2>
            <button>{banner.button}</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BannerBoxv2;
