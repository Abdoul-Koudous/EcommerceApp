import React, { useState, useEffect, useRef } from "react";
import "./populartabs.scss";
import ProductSlider from "../productslider";
import { fetchDataFromApi } from "../../pages/utils/api";
import { ProductLoading } from "../ProductLoading";
import { CategoryLoading } from "../CategoryLoading";

const PopularTabs = ({ defaultCategoryName = "Mode" }) => {
  const [categoriesData, setCategoriesData] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [popularProductsData, setPopularProductsData] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const scrollRef = useRef(null);

  // 1️⃣ Récupérer les catégories dynamiques
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetchDataFromApi("/api/category/");
        if (!res.error && res.data) {
          setCategoriesData(res.data);

          // Définir la catégorie par défaut (via prop),
          // sinon retomber sur la première catégorie disponible
          const defaultCategory =
            res.data.find((cat) => cat.name === defaultCategoryName) || res.data[0];
          setActiveTab(defaultCategory?._id || null);
        }
      } catch (err) {
        console.error("Erreur récupération catégories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [defaultCategoryName]);

  // 2️⃣ Récupérer les produits selon la catégorie active (triés par rating)
  useEffect(() => {
    if (!activeTab) return;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetchDataFromApi(`/api/product/getAllProductsByCatId/${activeTab}`);
        if (!res.error && res.products) {
          // Tri par rating décroissant
          const sortedProducts = res.products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          setPopularProductsData(sortedProducts);
        } else {
          setPopularProductsData([]);
        }
      } catch (err) {
        console.error("Erreur récupération produits:", err);
        setPopularProductsData([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [activeTab]);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });

  return (
    <div className="popular-tabs">
      <div className="popular-tabs-header">
        <div className="cont1-left">
          <h3>Produits populaires</h3>
          <p>Ne manquez pas les offres actuellement avant fin mars</p>
        </div>

        <div className="slider-wrapper">
          <button className="scroll-btn left" onClick={scrollLeft}>❮</button>
          <div className="tabs-slider" ref={scrollRef}>
            {loadingCategories ? (
              <CategoryLoading/>
            ) : categoriesData.length > 0 ? (
              categoriesData.map(cat => (
                <button
                  key={cat._id}
                  className={`tab-item ${activeTab === cat._id ? "active" : ""}`}
                  onClick={() => setActiveTab(cat._id)}
                >
                  {cat.name}
                </button>
              ))
            ) : (
              <p>Aucune catégorie trouvée</p>
            )}
          </div>
          <button className="scroll-btn right" onClick={scrollRight}>❯</button>
        </div>
      </div>

      <div className="cont2">
        {loadingProducts ? (
          <ProductLoading/>
        ) : popularProductsData.length > 0 ? (
          <ProductSlider products={popularProductsData} />
        ) : (
          <p>Aucun produit trouvé pour cette catégorie</p>
        )}
      </div>
    </div>
  );
};

export default PopularTabs;