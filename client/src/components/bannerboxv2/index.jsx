import React from "react";
import "./bannerboxv2.scss";
import AdsBannerSlider from "../sdsbannerslider";


const BannerBoxv2 = () => {
  return (
    <div className="banner-box-v2">

      {/* 🔥 SLIDE DU HAUT */}
      <div className="banner-item">
        <AdsBannerSlider categoryName="Téléphones et tablettes" limit={1} />
      </div>

      {/* 🔥 SLIDE DU BAS */}
      <div className="banner-item">
        <AdsBannerSlider categoryName="Mode" limit={1} />
      </div>

    </div>
  );
};

export default BannerBoxv2;