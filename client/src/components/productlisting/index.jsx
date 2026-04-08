import React, { useState, useEffect } from 'react';
import { 
  FaThLarge, FaBars, FaSortDown, FaSortUp, 
  FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight 
} from "react-icons/fa";
import SideBar from '../sidebar';
import ProductItem from '../productitem';
import ProductItemView from './ProductListView';

import "./productlisting.scss";
import { fetchDataFromApi } from '../../pages/utils/api';
import CircularProgress from '../../../../admin/src/components/CircularProgress/CircularProgress';

const ProductListing = () => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("Trier par");
  const [viewMode, setViewMode] = useState("grid");
  const [products, setProducts] = useState([]);
  const [sortedProducts, setSortedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const productsPerPage = 2; // tu peux changer

  // --- Récupération des produits ---
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetchDataFromApi("/api/product/getAllProducts");
        let fetchedProducts = res.products || res.data || res;

        // Normalisation : garder images comme elles sont
        fetchedProducts = fetchedProducts.map(p => ({
          ...p,
          images: p.images || []
        }));

        // Trier par produit le plus récent
        fetchedProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setProducts(fetchedProducts);
        setSortedProducts(fetchedProducts);
      } catch (err) {
        console.error(err);
        setProducts([]);
        setSortedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSortSelect = (option) => {
    setSelectedSort(option);
    setIsSortOpen(false);

    let sorted = [...products];
    switch(option) {
      case "Par nom : A → Z":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "Par nom : Z → A":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
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

  // Pages visibles
  const pageRange = 2;
  const startPage = Math.max(1, currentPage - pageRange);
  const endPage = Math.min(totalPages, currentPage + pageRange);
  const visiblePages = [];
  for (let i = startPage; i <= endPage; i++) visiblePages.push(i);

  return (
    <section className='productlisting'>
      <div className="container1">
        <nav className="breadcrumbs">
          <ul>
            <li><a href="/">Accueil</a></li>
            <li><a href="/categorie">Électronique</a></li>
            <li className="active">Produit</li>
          </ul>
        </nav>
      </div>

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

          <div className="bodi">
            {loading ? (
              <div className="loader">
                <CircularProgress/>
              </div>
            ) : (
              viewMode === "grid" ? (
                <div className="product-grid">
                  {currentProducts.map(p => <ProductItem key={p._id} product={p} />)}
                </div>
              ) : (
                <div className="product-list">
                  {currentProducts.map(p => <ProductItemView key={p._id} product={p} />)}
                </div>
              )
            )}
          </div>

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