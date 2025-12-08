import React, { useState, useEffect } from 'react';
import { 
  FaThLarge, FaBars, FaSortDown, FaSortUp, 
  FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight 
} from "react-icons/fa";
import SideBar from '../sidebar';
import ProductItem from '../productitem';
import ProductItemView from './ProductListView';
import "./productlisting.scss";

const ProductListing = () => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("Trier par");
  const [viewMode, setViewMode] = useState("grid");
  const [sortedProducts, setSortedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 2;

  const products = [
    { id: 1, image1: "/od11.jpg", image2: "/od12.jpg", title: "Montre connectée Pro", desc: "Montre intelligente avec capteur cardiaque", price: 15000, oldPrice: 20000, discount: 25, rating: 5, isNew: true },
    { id: 2, image1: "/od21.jpg", image2: "/od22.jpg", title: "Écouteurs Bluetooth X10", desc: "Autonomie 24h avec boîtier de charge", price: 10000, oldPrice: 12000, discount: 17, rating: 4, isNew: true },
    { id: 3, image1: "/od12.jpg", image2: "/od13.jpg", title: "Smartphone Galaxy Z", desc: "128 Go, double SIM, écran HD", price: 85000, oldPrice: 95000, discount: 11, rating: 5, isNew: false },
    { id: 4, image1: "/od32.jpg", image2: "/od31.jpg", title: "Casque Audio ProBass", desc: "Son clair et basse profonde", price: 30000, oldPrice: 35000, discount: 14, rating: 4, isNew: false },
    { id: 5, image1: "/od32.jpg", image2: "/od31.jpg", title: "Casque Audio ProBass", desc: "Son clair et basse profonde", price: 30000, oldPrice: 35000, discount: 14, rating: 4, isNew: false },
    { id: 6, image1: "/od41.jpg", image2: "/od42.jpg", title: "Tablette 10 pouces HD", desc: "Android 13, 64Go, 4G LTE", price: 55000, oldPrice: 65000, discount: 15, rating: 5, isNew: true },
    { id: 7, image1: "/od51.jpg", image2: "/od52.jpg", title: "Chargeur rapide 25W", desc: "USB-C, compatible Samsung & iPhone", price: 5000, oldPrice: 8000, discount: 38, rating: 4, isNew: false },
  ];

  useEffect(() => {
    setSortedProducts([...products]);
  }, []);

  const handleSortSelect = (option) => {
    setSelectedSort(option);
    setIsSortOpen(false);
    let sorted = [...products];

    switch(option) {
      case "Par nom : A → Z":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "Par nom : Z → A":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "Par prix : inférieur → supérieur":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "Par prix : supérieur → inférieur":
        sorted.sort((a, b) => b.price - a.price);
        break;
      default:
        sorted = [...products];
    }

    setSortedProducts(sorted);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Afficher seulement un petit groupe de pages (max 5 visibles)
  const pageRange = 2;
  const startPage = Math.max(1, currentPage - pageRange);
  const endPage = Math.min(totalPages, currentPage + pageRange);
  const visiblePages = [];
  for (let i = startPage; i <= endPage; i++) visiblePages.push(i);

  return (
    <section className='productlisting'>
      {/* Fil d’Ariane */}
      <div className="container1">
        <nav className="breadcrumbs">
          <ul>
            <li><a href="/">Accueil</a></li>
            <li><a href="/categorie">Électronique</a></li>
            <li className="active">Produit</li>
          </ul>
        </nav>
      </div>

      {/* Contenu principal */}
      <div className="container2">
        <div className="sidebar"><SideBar /></div>

        <div className="right-cont">
          <div className="head">
            <div className="layout-icons">
              <FaThLarge 
                className={`icon ${viewMode === "grid" ? "active" : ""}`} 
                title="Vue Grille" 
                onClick={() => setViewMode("grid")} 
              />
              <FaBars 
                className={`icon ${viewMode === "list" ? "active" : ""}`} 
                title="Vue Liste" 
                onClick={() => setViewMode("list")} 
              />
              <span className="product-count">{sortedProducts.length} produits</span>
            </div>

            <div className="sort-section">
              <button className="sort-btn" onClick={() => setIsSortOpen(!isSortOpen)}>
                {selectedSort}
                <span className="icon">{isSortOpen ? <FaSortUp /> : <FaSortDown />}</span>
              </button>

              <ul className={`sort-options ${isSortOpen ? "open" : ""}`}>
                <li onClick={() => handleSortSelect("Par nom : A → Z")}>Par nom : A → Z</li>
                <li onClick={() => handleSortSelect("Par nom : Z → A")}>Par nom : Z → A</li>
                <li onClick={() => handleSortSelect("Par prix : inférieur → supérieur")}>Par prix : inférieur → supérieur</li>
                <li onClick={() => handleSortSelect("Par prix : supérieur → inférieur")}>Par prix : supérieur → inférieur</li>
              </ul>
            </div>
          </div>

          {/* Produits */}
          <div className="bodi">
            {viewMode === "grid" ? (
              <div className="product-grid">
                {currentProducts.map(p => <ProductItem key={p.id} {...p} />)}
              </div>
            ) : (
              <div className="product-list">
                {currentProducts.map(p => <ProductItemView key={p.id} {...p} />)}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="foot">
            <div className="pagination">
              <button onClick={() => paginate(1)} disabled={currentPage === 1}><FaAngleDoubleLeft /></button>
              <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}><FaAngleLeft /></button>

              {startPage > 1 && <span className="dots">...</span>}

              {visiblePages.map(num => (
                <button 
                  key={num} 
                  onClick={() => paginate(num)} 
                  className={currentPage === num ? "active" : ""}
                >
                  {num}
                </button>
              ))}

              {endPage < totalPages && <span className="dots">...</span>}

              <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}><FaAngleRight /></button>
              <button onClick={() => paginate(totalPages)} disabled={currentPage === totalPages}><FaAngleDoubleRight /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductListing;
