import React, { useEffect, useState } from "react";
import HomeSlider from "../../components/homeslider";
import HomeCatSlider from "../../components/homecatslider";
import { FaShippingFast } from "react-icons/fa";
import AdsBannerSlider from "../../components/sdsbannerslider";
import PopularTabs from "../../components/populartabs";
import ProductSlider from "../../components/productslider";
import BlogSlider from "../../components/blogslider.jsx";
import HomeBannerV2 from "../../components/homesliderv2/index.jsx";
import BannerBoxv2 from "../../components/bannerboxv2/index.jsx";
import "./home.scss";
import { fetchDataFromApi } from "../utils/api.js";
import CircularProgress from "../../../../admin/src/components/CircularProgress/CircularProgress.jsx";

const Home = () => {
  const [latestProducts, setLatestProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
    // 🔹 Derniers produits
    fetchDataFromApi("/api/product/getAllProducts?sort=desc&limit=8")
      .then((res) => {
        const products = res.products || res.data || res;
        // Tri par date (si API ne le fait pas) et limite
        const sortedLatest = products
          .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
          .slice(0, 8);
        setLatestProducts(sortedLatest);
      })
      .catch((err) => console.error("Erreur derniers produits :", err))
      .finally(() => setLoadingLatest(false));

    // 🔹 Produits populaires / featured
    fetchDataFromApi("/api/product/getAllFeaturedProducts")
      .then((res) => {
        const products = res.products || res.data || res;
        // ⚡ Securité: filtrer ceux avec isFeatured=true
        const featured = products.filter((p) => p.isFeatured);
        setFeaturedProducts(featured);
      })
      .catch((err) => console.error("Erreur produits populaires :", err))
      .finally(() => setLoadingFeatured(false));
  }, []);

  return (
    <>
      {/* Slider principal */}
      <HomeSlider />

      

      {/* Slider catégories */}
      <HomeCatSlider />

      {/* Produits populaires / tabs */}
      <section className="section1">
        <div className="container">
          <div className="cont1">
            <div className="cont1-right">
              <PopularTabs />
            </div>
          </div>
        </div>
      </section>

      {/* Bannière principale + boxes */}
      <section className="banner-section">
        <div className="slide-wrapper">
          <HomeBannerV2 />
        </div>
        <div className="box-wrapper">
          <BannerBoxv2 />
        </div>
      </section>

      {/* Livraison et Ads */}
      <section className="section2">
        <div className="container">
          <div className="freeshipping">
            <div className="free1">
              <FaShippingFast />
              <span>Livraison Gratuit</span>
            </div>
            <div className="free2">
              <p>Recevez vos produits gratuitement sur vos premiers achats</p>
            </div>
            <div className="free3">
              <p>A partir de 20 000 FCFA</p>
            </div>
          </div>
          <AdsBannerSlider categoryNames={["L'informatique", "Téléphones et tablettes", "Mode"]} limit={4} />
          {/* <AdsBannerSlider categoryName="Téléphones et tablettes"  limit={2} /> */}
        </div>
      </section>

      {/* Derniers produits */}
      <section className="section3">
        <div className="container">
          <h2>Derniers Produits</h2>
          {loadingLatest ? (
            <CircularProgress/>
          ) : latestProducts.length > 0 ? (
            <ProductSlider products={latestProducts} />
          ) : (
            <p>Aucun produit trouvé</p>
          )}
          <AdsBannerSlider categoryName="Mode"  limit={4} />
        </div>
      </section>

      {/* Meilleurs produits / Populaires */}
      <section className="section3">
        <div className="container">
          <h2>Meilleurs Produits</h2>
          {loadingFeatured ? (
            <CircularProgress/>
          ) : featuredProducts.length > 0 ? (
            <ProductSlider products={featuredProducts} />
          ) : (
            <p>Aucun produit populaire trouvé</p>
          )}
          <AdsBannerSlider categoryName="L'informatique" limit={2} />
        </div>
      </section>

      {/* Derniers articles du blog */}
      <section className="section4">
        <div className="container">
          <h2>Derniers Articles du Blog</h2>
          <BlogSlider items={3} />
        </div>
      </section>
    </>
  );
};

export default Home;