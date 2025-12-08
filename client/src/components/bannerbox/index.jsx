import React from 'react';

const BannerBox = ({ img }) => {
  return (
    <div className="banner-box-item">
      <img src={img} alt="Bannière publicitaire" />
    </div>
  );
};

export default BannerBox;
