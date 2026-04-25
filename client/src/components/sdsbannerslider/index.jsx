import React, { useEffect, useState } from "react";

import { fetchDataFromApi } from "../../pages/utils/api";
import "./adsBannerSlider.scss";
import BannerBox from "./BannerBox";

const AdsBannerSlider = ({ catId, categoryName, categoryNames, limit = 4 }) => {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    fetchDataFromApi("/api/bannerV1").then((res) => {
      if (res?.data) {
        let filtered = res.data;

        // 🔥 plusieurs catégories
        if (categoryNames && categoryNames.length > 0) {
          filtered = filtered.filter((b) =>
            categoryNames.some(
              (cat) => cat.toLowerCase() === b.categoryName.toLowerCase()
            )
          );
        }
        // 🔥 une seule catégorie
        else if (categoryName) {
          filtered = filtered.filter(
            (b) => b.categoryName === categoryName
          );
        }
        // 🔥 par ID
        else if (catId) {
          filtered = filtered.filter((b) => b.catId === catId);
        }

        setBanners(filtered.slice(0, limit));
      }
    });
  }, [catId, categoryName, categoryNames, limit]);

  return (
    <div className="ads-slider">
      {banners.map((banner) => (
        <BannerBox key={banner._id} banner={banner} />
      ))}
    </div>
  );
};
export default AdsBannerSlider;