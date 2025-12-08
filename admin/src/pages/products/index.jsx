import React, { useState } from "react";
import { FaEdit, FaEye, FaTrash, FaPlus, FaDownload, FaSearch } from "react-icons/fa";
import "./productslist.scss";
import PaginationPro from "../../components/paginnationpro/paginationpro";
import AddProduct from "./addproduct";

const Product = () => {
  const products = [
    {
      id: 1,
      image: "/od11.jpg",
      title: "Nike Air Max",
      description: "Chaussures de sport homme",
      category: "Chaussures",
      subcategory: "Running",
      price: "$120",
      sales: 10,
    },
    {
      id: 2,
      image: "/od21.jpg",
      title: "Apple Watch",
      description: "Montre connectée série 8",
      category: "Accessoires",
      subcategory: "Montres",
      price: "$350",
      sales: 40,
    },
    {
      id: 3,
      image: "/od31.jpg",
      title: "MacBook Air M2",
      description: "Ordinateur portable Apple",
      category: "Informatique",
      subcategory: "Laptops",
      price: "$999",
      sales: 90,
    },
    {
      id: 4,
      image: "/od41.jpg",
      title: "Samsung Galaxy S24",
      description: "Smartphone 128Go, 5G",
      category: "Téléphonie",
      subcategory: "Smartphones",
      price: "$899",
      sales: 65,
    },
    {
      id: 5,
      image: "/od51.jpg",
      title: "Casque Bose QC45",
      description: "Casque Bluetooth à réduction de bruit",
      category: "Audio",
      subcategory: "Casques",
      price: "$299",
      sales: 50,
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const allCategories = ["Toutes", ...new Set(products.map((p) => p.category))];
  const [showDialog, setShowDialog] = useState(false);

  // 🔹 Filtrage par catégorie et recherche
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "Toutes" || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedFiltered = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const visibleIds = displayedFiltered.map((p) => p.id);
      setSelectedProducts(visibleIds);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const allSelected =
    displayedFiltered.length > 0 &&
    displayedFiltered.every((p) => selectedProducts.includes(p.id));

  return (
    <div className="admin-pages"> 
     {/* 🔹 Header principal */}
      <div className="header">
        <h2>Liste des produits</h2>
        <div className="header-actions">
          <button className="export-btn">
            <FaDownload /> Exporter
          </button>
          <button className="add-btn" onClick={() => setShowDialog(true)}>
            <FaPlus /> Ajouter un produit
          </button>
        </div>
      </div>
        <div className="product-table-container">
     

      {/* 🔹 Filtres + barre de recherche */}
      <div className="filters-actions">
        <div className="left">
          <label>Catégorie :</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="category-select"
          >
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 🔍 Barre de recherche */}
        <div className="search-bar">
          <FaSearch className="icon" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* 🔹 Tableau principal */}
      <table className="product-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
              />
            </th>
            <th>Produit</th>
            <th>Catégorie</th>
            <th>Sous-catégorie</th>
            <th>Prix</th>
            <th>Ventes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayedFiltered.map((product) => (
            <tr key={product.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => handleSelectOne(product.id)}
                />
              </td>
              <td className="product-info">
                <img src={product.image} alt={product.title} />
                <div>
                  <h4>{product.title}</h4>
                  <p>{product.description}</p>
                </div>
              </td>
              <td>{product.category}</td>
              <td>{product.subcategory}</td>
              <td className="price">{product.price}</td>
              <td className="sales">
                <span>{product.sales}%</span>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{
                      width: `${product.sales}%`,
                      background:
                        product.sales < 40
                          ? "#ef4444"
                          : product.sales < 70
                          ? "#facc15"
                          : "#22c55e",
                    }}
                  ></div>
                </div>
              </td>
              <td className="actions">
                <button className="view">
                  <FaEye />
                </button>
                <button className="edit">
                  <FaEdit />
                </button>
                <button className="delete">
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔹 Pagination */}
      <div className="table-footer">
        <div className="items-selector">
          <label>Afficher</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
          <span>éléments</span>
        </div>

        <PaginationPro
          currentPage={currentPage}
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
     {/* --- Modale plein écran --- */}
      {showDialog && <AddProduct onClose={() => setShowDialog(false)} />}

    </div>
  
  );
};

export default Product;
