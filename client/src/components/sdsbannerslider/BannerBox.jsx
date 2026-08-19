import React from "react";
import { Link } from "react-router-dom";
import "./bannerBox.scss";

const BannerBox = ({ banner }) => {
  return (
    <Link
      to={banner.catId ? `/productlisting?catId=${banner.catId}` : "#"}
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
    </Link>
  );
};

export default BannerBox;