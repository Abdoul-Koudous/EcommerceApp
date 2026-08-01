import React, { useState } from 'react';
import { FaThLarge, FaBars, FaSortDown, FaSortUp, FaSlidersH } from "react-icons/fa";
import SideBar from '../sidebar';
import ProductItem from '../productitem';

import "./productlisting.scss";
import { ProductLoading } from '../ProductLoading';
import PaginationPro from '../paginnationpro/paginationpro';
import ProductItemView from './productlistview';

const SearchPage = () => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSort, setSelectedSort] = useState("Trier par");
  const [productsData, setProductsData] = useState({});
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  // ✅ Contrôle l'affichage de la sidebar : icône repliée ou dropdown ouvert (mobile/tablette)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Plus de fetch ici : SideBar est l'unique source de vérité.
  // Il lit sortBy/order en props et gère aussi catId, prix, note et le "q" de la recherche depuis l'URL.

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
      <div className="pl-breadcrumb-wrapper">
        <nav className="pl-breadcrumbs">
          <ul>
            <li><a href="/">Accueil</a></li>
            <li><a href="/productlisting">Boutique</a></li>
            <li className="active">Résultats de recherche</li>
          </ul>
        </nav>
      </div>

      <div className="pl-body">
        <div className={`pl-sidebar ${sidebarOpen ? "open" : ""}`}>
          <button
            className="pl-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Fermer les filtres" : "Afficher les filtres"}
          >
            <FaSlidersH />
          </button>

          <div className="pl-sidebar-panel">
            <SideBar
              productsData={productsData}
              setProductsData={setProductsData}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              setTotalPages={setTotalPages}
              sortBy={sortBy}
              order={order}
            />
          </div>
        </div>

        <div className="pl-content">
          <div className="pl-head">
            <div className="pl-layout-icons">
              <FaThLarge
                className={`pl-icon ${viewMode === "grid" ? "active" : ""}`}
                title="Vue Grille"
                onClick={() => setViewMode("grid")}
              />
              <FaBars
                className={`pl-icon ${viewMode === "list" ? "active" : ""}`}
                title="Vue Liste"
                onClick={() => setViewMode("list")}
              />
              <span className="pl-product-count">
                Nous avons {productsData?.total ?? productsData?.products?.length ?? 0} produits
              </span>
            </div>

            <div className="pl-sort-section">
              <button className="pl-sort-btn" onClick={() => setIsSortOpen(!isSortOpen)}>
                {selectedSort}
                <span className="pl-icon">{isSortOpen ? <FaSortUp /> : <FaSortDown />}</span>
              </button>

              <ul className={`pl-sort-options ${isSortOpen ? "open" : ""}`}>
                <li onClick={() => handleSortSelect("Par nom : A → Z")}>Par nom : A → Z</li>
                <li onClick={() => handleSortSelect("Par nom : Z → A")}>Par nom : Z → A</li>
                <li onClick={() => handleSortSelect("Par prix : inférieur → supérieur")}>Par prix : inférieur → supérieur</li>
                <li onClick={() => handleSortSelect("Par prix : supérieur → inférieur")}>Par prix : supérieur → inférieur</li>
              </ul>
            </div>
          </div>

          <div className="pl-bodi">
            {isLoading ? (
              <ProductLoading />
            ) : viewMode === "grid" ? (
              <div key={viewMode} className="pl-product-grid">
                {productsData?.products?.length > 0 ? (
                  productsData.products.map((item) => (
                    <ProductItem key={item._id} product={item} />
                  ))
                ) : (
                  <p>Aucun produit trouvé</p>
                )}
              </div>
            ) : (
              <div key={viewMode} className="pl-product-list">
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

export default SearchPage;