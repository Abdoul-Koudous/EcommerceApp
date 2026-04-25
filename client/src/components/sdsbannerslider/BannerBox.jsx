import React from "react";
import "./bannerBox.scss";

const BannerBox = ({ banner }) => {
  return (
    <div
      className={`banner-box ${banner.alignInfo}`}
      style={{
        backgroundImage: `url(${banner.images?.[0]})`,
      }}
    >
      <div className="overlay"></div>

      <div className="banner-content">
        <p>{banner.categoryName}</p>
        <hr />
        <h3>{banner.bannerTitle}</h3>
        
        <p className="price">{banner.price} FCFA</p>

        <button className="btn">Voir plus</button>
      </div>
    </div>
  );
};

export default BannerBox;