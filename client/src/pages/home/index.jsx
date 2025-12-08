import React from 'react'
import HomeSlider from '../../components/homeslider'
import HomeCatSlider from '../../components/homecatslider'
import { FaShippingFast } from "react-icons/fa";
import AdsBannerSlider from '../../components/sdsbannerslider';
import PopularTabs from '../../components/populartabs';
import ProductSlider from '../../components/productslider';
import BlogSlider from '../../components/blogslider.jsx';
import HomeBannerV2 from '../../components/homesliderv2/index.jsx';
import BannerBoxv2 from '../../components/bannerboxv2/index.jsx';
import "./home.scss";

const Home = () => {
  return (
    <>
    <HomeSlider/>
    <section className="banner-section">
      <div className="slide-wrapper">
        <HomeBannerV2 />
      </div>
      <div className="box-wrapper">
        <BannerBoxv2 />
      </div>
    </section>

  

    <HomeCatSlider />
    <section className='section1'>
      <div className="container">
        <div className="cont1">
          <div className="cont1-left">
            <h3>Produits populaires</h3>
            <p>Ne manquez pas les offres actuellement avant fin mars</p>
          </div>
          <div className="cont1-right">
            <PopularTabs/>
          </div>
        </div>
        <div className="cont2">
          <ProductSlider/>
        </div>
      </div>

    </section>
    <section className='section2'>
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
            <p>A partie de 20000 fcfa</p>
          </div>
        </div>
        <AdsBannerSlider items={5} /> 
      </div>

    </section>

    <section className='section3'>
      <div className="container">
        <h2>Derniers Produits</h2>
        <ProductSlider/>
        <AdsBannerSlider items={3} /> 
      </div>
    </section>
    <section className='section3'>
      <div className="container">
        <h2>Meilleurs Produits</h2>
        <ProductSlider/>
        <AdsBannerSlider items={2} /> 
      </div>
    </section>

    <section className='section4'>
      <div className="container">
        <h2>Derniers Articles du Blog</h2>
        <BlogSlider items={3}/>
      </div>
    </section>
    
    </>
  )
}

export default Home