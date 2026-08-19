import React, { useRef, useEffect, useState } from "react";
import ProductItem from "../productitem";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./productslider.scss";
import { fetchDataFromApi } from "../../pages/utils/api";
import { ProductLoading } from "../ProductLoading";

const ProductSlider = ({ categoryId = null, products = null }) => {
  const scrollRef = useRef(null);
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si products est explicitement fourni (même vide), on l'utilise tel quel
    if (products !== null) {
      setProductsData(products);
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      let url = "/api/product/getAllProducts";
      if (categoryId) url = `/api/product/getAllProductsByCatId/${categoryId}`;

      try {
        const res = await fetchDataFromApi(url);
        const fetchedProducts = res.products || res.data || res;
        setProductsData(fetchedProducts);
      } catch (err) {
        console.error(err);
        setProductsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, products]);

  const scrollLeft = () =>
    scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  const scrollRight = () =>
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });

  return (
    <div className="product-slider-wrapper">
      <button className="scroll-btn left" onClick={scrollLeft}>
        <FaChevronLeft />
      </button>

      <div className="product-slider" ref={scrollRef}>
        {loading ? (
          <ProductLoading/>
        ) : productsData.length > 0 ? (
         productsData.map((p) => <ProductItem key={p._id} product={p} />)
        ) : (
          <p>Aucun produit trouvé</p>
        )}
      </div>

      <button className="scroll-btn right" onClick={scrollRight}>
        <FaChevronRight />
      </button>
    </div>
  );
};

export default ProductSlider;