import React, { useState, useEffect } from 'react';
import { 
  FaThLarge, FaBars, FaSortDown, FaSortUp, 
  FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight 
} from "react-icons/fa";
import SideBar from '../sidebar';
import ProductItem from '../productitem';
import ProductItemView from './ProductListView';

import "./productlisting.scss";
import { fetchDataFromApi, postData } from '../../pages/utils/api';
import { ProductLoading } from '../ProductLoading';
import PaginationPro from '../paginnationpro/paginationpro';


const ProductListing = () => {
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [viewMode, setViewMode] = useState("grid");
  




  const [isLoading, setIsLoading] = useState(false );

  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
   
const [selectedSort, setSelectedSort] = useState("Trier par");
const [productsData, setProductsData] = useState({});
const [page, setPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(20);
const [sortBy, setSortBy] = useState("createdAt");
const [order, setOrder] = useState("desc");

useEffect(() => {
  postData("/api/product/sortBy", {
    sortBy,
    order,
    page,
    limit: itemsPerPage
  }).then((res) => {
    setProductsData(res);
  });
}, [page, sortBy, order]);

  const handleSortSelect = (option) => {
  setSelectedSort(option);
  setIsSortOpen(false);

  let newSortBy = "createdAt";
  let newOrder = "desc";

  if (option === "Par nom : A → Z") {
    newSortBy = "name";
    newOrder = "asc";
  }

  if (option === "Par nom : Z → A") {
    newSortBy = "name";
    newOrder = "desc";
  }

  if (option === "Par prix : inférieur → supérieur") {
    newSortBy = "price";
    newOrder = "asc";
  }

  if (option === "Par prix : supérieur → inférieur") {
    newSortBy = "price";
    newOrder = "desc";
  }

  setSortBy(newSortBy);
  setOrder(newOrder);
};
  
  return (
    <section className='productlisting'>
      {console.log(productsData)}
      <div className="container1">
        <nav className="breadcrumbs">
          <ul>
            <li><a href="/">Accueil</a></li>
            <li><a href="/productlisting">Boutique</a></li>
            <li className="active">Produit</li>
          </ul>
        </nav>
      </div>

      <div className="container2">
        <div className="sidebar">
          <SideBar 
          productsData = {productsData} 
          setProductsData = {setProductsData}
          isLoading = {isLoading}
          setIsLoading = {setIsLoading}
          page = {page}
          setPage = {setPage}
          totalPages = {totalPages}
          setTotalPages = {setTotalPages}
          />
        </div>

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
              <span className="product-count">Nous avons {productsData?.products?.length || 0} produits</span>
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
            {isLoading ? (
                <ProductLoading />
              ) : viewMode === "grid" ? (
                <div key={viewMode} className="product-grid">
                  {productsData?.products?.length > 0 ? (
                    productsData.products.map((item) => (
                      <ProductItem key={item._id} product={item} />
                    ))
                  ) : (
                    <p>Aucun produit trouvé</p>
                  )}
                </div>
              ) : (
                <div key={viewMode} className="product-list">
                  {productsData?.products?.length > 0 ? (
                    productsData.products.map((item) => (
                      <ProductItemView key={item._id} product={item} />
                    ))
                  ) : (
                    <p>Aucun produit trouvé</p>
                  )}
                </div>
              )}
          </div>

          <PaginationPro
            page={page}
            totalPages={productsData?.totalPages || 1}
            setPage={setPage}
          />

          
        </div>
      </div>
    </section>
  );
};

export default ProductListing;