import React, { useEffect, useState,useContext  } from "react";
import { Link } from "react-router-dom";
import { FaEdit, FaEye, FaTrash, FaPlus, FaDownload, FaSearch } from "react-icons/fa";
import "./productslist.scss";
import PaginationPro from "../../components/paginnationpro/paginationpro";
import AddProduct from "./addproduct";
import { deleteData, fetchDataFromApi } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import EditProduct from "./editproduct";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const Product = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [productData, setProductData] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const { openToast } = useContext(ToastContext);
  const [productCat, setProductCat] = useState(""); // Catégorie principale
  const [productSubCat, setProductSubCat] = useState(""); // Sous-catégorie
  const [productThirdSubCat, setProductThirdSubCat] = useState(""); // Sous-sous-catégorie
  const [allCategories, setAllCategories] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [allThirdSubCategories, setAllThirdSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);







 useEffect(() => {
  const fetchProducts = async () => {
    setLoading(true); // 🔹 start loading
    const res = await fetchDataFromApi("/api/product/getAllProducts");
    if (!res.error) {
      setProductData(res.products || []);

      // Listes uniques
      const cats = [...new Set(res.products.map(p => p.catName))];
      const subCats = [...new Set(res.products.map(p => p.subCat))];
      const thirdSubs = [...new Set(res.products.map(p => p.thirdsubCat))];

      setAllCategories(cats.map(name => ({ _id: name, name })));
      setAllSubCategories(subCats.map(name => ({ _id: name, name })));
      setAllThirdSubCategories(thirdSubs.map(name => ({ _id: name, name })));
    }
    setLoading(false); // 🔹 finish loading
  };

  fetchProducts();
}, []);

const getProducts = async () => {
  setLoading(true);
  const res = await fetchDataFromApi("/api/product/getAllProducts");
  if (!res.error) {
    setProductData(res.products || []);

    const cats = [...new Set(res.products.map(p => p.catName))];
    const subCats = [...new Set(res.products.map(p => p.subCat))];
    const thirdSubs = [...new Set(res.products.map(p => p.thirdsubCat))];

    setAllCategories(cats.map(name => ({ _id: name, name })));
    setAllSubCategories(subCats.map(name => ({ _id: name, name })));
    setAllThirdSubCategories(thirdSubs.map(name => ({ _id: name, name })));
  }
  setLoading(false);
};




  const handleChangeProductCat = async (event) => {
  const catId = event.target.value;
  setProductCat(catId);
  setProductSubCat("");
  setProductThirdSubCat("");
  setAllSubCategories([]);
  setAllThirdSubCategories([]);

  if (!catId) {
    // Si "Toutes", récupère tous les produits
    await getProducts();
    return;
  }

  const res = await fetchDataFromApi(`/api/product/getAllProductsByCatId/${catId}`);
  if (!res.error) {
    setProductData(res.products || []);

    // Récupérer les sous-catégories uniques
    const subCats = [...new Set(res.products.map(p => p.subCat))].map(name => ({ _id: name, name }));
    setAllSubCategories(subCats);
  }
};


const handleChangeProductSubCat = (event) => {
  const subCatId = event.target.value;
  setProductSubCat(subCatId);
  setProductThirdSubCat("");
  setAllThirdSubCategories([]);

  fetchDataFromApi(`/api/product/getAllProductsBySubCatId/${subCatId}`).then((res) => {
    if (!res.error) {
      setProductData(res.products || []);

      // créer la liste des sous-sous-catégories
      const thirdSubs = [...new Set(res.products.map(p => p.thirdsubCat))].map(name => ({ _id: name, name }));
      setAllThirdSubCategories(thirdSubs);
    }
  });
};

const handleChangeProductThirdSubCat = (event) => {
  const thirdSubId = event.target.value;
  setProductThirdSubCat(thirdSubId);

  fetchDataFromApi(`/api/product/getAllProductsByThirdLavelCat/${thirdSubId}`).then((res) => {
    if (!res.error) {
      setProductData(res.products || []);
    }
  });
};

  // Filtrage indépendant
const filteredProducts = productData.filter(p => {
  const matchesCat = !productCat || p.catName === productCat;
  const matchesSubCat = !productSubCat || p.subCat === productSubCat;
  const matchesThirdSubCat = !productThirdSubCat || p.thirdsubCat === productThirdSubCat;
  const matchesSearch = !searchTerm ||
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase());
  
  return matchesCat && matchesSubCat && matchesThirdSubCat && matchesSearch;
});



  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedFiltered = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (e) => {
  const visibleIds = displayedFiltered.map(p => p._id);

  setSelectedProducts(prev => {
    const next = e.target.checked
      ? Array.from(new Set([...prev, ...visibleIds]))
      : prev.filter(id => !visibleIds.includes(id));

    console.log("🔵 SELECT ALL → selectedProducts:", next, "count:", next.length);
    return next;
  });
};




  const handleSelectOne = (id) => {
  setSelectedProducts(prev => {
    const next = prev.includes(id)
      ? prev.filter(pid => pid !== id)
      : [...prev, id];

    console.log("🟢 CLICK → selectedProducts:", next, "count:", next.length);
    return next;
  });
};




  const handleDeleteClick = (id) => {
    setToDeleteId(id);
    setConfirmOpen(true);
  };


 const handleConfirmDelete = async () => {
  try {
    if (toDeleteId) {
      // 🔴 suppression individuelle
      const res = await deleteData(`/api/product/${toDeleteId}`);

      if (!res?.error) {
        setProductData(prev => prev.filter(p => p._id !== toDeleteId));
        openToast("success", res?.message || "Produit supprimé ");
      }
    } else if (selectedProducts.length > 0) {
      // 🟢 suppression multiple
      const res = await deleteData(
        "/api/product/deleteMultipleProduct",
         { ids: selectedProducts }
      );

      if (!res?.error) {
        setProductData(prev =>
          prev.filter(p => !selectedProducts.includes(p._id))
        );
        setSelectedProducts([]);
        openToast("success", res?.message || "Produits supprimés");
      }
    }
  } catch (error) {
    console.error(error);
    openToast("error", error.message || "Erreur serveur lors de la suppression");
  }

  setToDeleteId(null);
  setConfirmOpen(false);
};


  const handleCancelDelete = () => {
    setToDeleteId(null);
    setConfirmOpen(false);
  };
  

const [selectedCount, setSelectedCount] = useState(0);


useEffect(() => {
  console.log("🟡 EFFECT → selectedProducts.length =", selectedProducts.length);
}, [selectedProducts]);



  const allSelected =
  displayedFiltered.length > 0 &&
  displayedFiltered.every(p => selectedProducts.includes(p._id));


  return (
    <div className="admin-pages">
      <div className="header">
        <h2>Liste des produits</h2>
        
        <div className="header-actions">
<button
  className={`delete-multiple-btn ${
    selectedProducts.length > 0 ? "show" : "hide"
  }`}
  onClick={() => {
    setToDeleteId(null);      // IMPORTANT : null = suppression multiple
    setConfirmOpen(true);
  }}
>
  <FaTrash />
  <span>Supprimer</span>
  <strong>{selectedProducts.length}</strong>
</button>






          <button className="export-btn"><FaDownload /> Exporter</button>

         
          <button className="add-btn" onClick={() => setShowAddDialog(true)}>
            <FaPlus /> Ajouter un produit
          </button>
        </div>

      </div>

      <div className="product-table-container">
       {
       loading ? (<div className="loading"><CircularProgress /></div>) : (
        <>
         <div className="filters-actions">
          <div className="left">
              <div className="form-group">
                <label>Catégorie</label>
            <select value={productCat} onChange={e => setProductCat(e.target.value)}>
              <option value="">Toutes</option>
              {allCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
              <div className="form-group">
                <label>sous Catégorie</label>
            <select value={productSubCat} onChange={e => setProductSubCat(e.target.value)}>
              <option value="">Toutes</option>
              {allSubCategories.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
            <div className="form-group">
                <label>Dernier sous Catégorie</label>

            <select value={productThirdSubCat} onChange={e => setProductThirdSubCat(e.target.value)}>
              <option value="">Toutes</option>
              {allThirdSubCategories.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
            </select>
            </div>



          </div>
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

        <table className="product-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={allSelected} onChange={handleSelectAll} /></th>
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
              <tr key={product._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product._id)}
                    onChange={() => handleSelectOne(product._id)}
                  />
                </td>
                <td className="product-info">
                  <Link to={`/product/${product._id}`}>
                    <img src={product.images?.[0]} alt={product.name} />
                  </Link>
                  <div>
                    <Link to={`/product/${product._id}`}><h4>{product.name}</h4></Link>
                    <p>{product.brand}</p>
                  </div>
                </td>
                <td>{product.catName}</td>
                <td>{product.subCat || "—"}</td>
                <td className="price">
                  {product.oldPrice > 0 && (
                    <div className="old-price">{product.oldPrice} FCFA</div>
                  )}
                  <div className="current-price">{product.price} FCFA</div>
                </td>

                <td className="sales">
                  <span>{product.sale}%</span>
                  <div className="progress-bar">
                    <div
                      className="progress"
                      style={{
                        width: `${product.sale}%`,
                        background:
                          product.sale < 40 ? "#ef4444" :
                          product.sale < 70 ? "#facc15" :
                          "#22c55e",
                      }}
                    ></div>
                  </div>
                </td>
                <td className="actions">
                  <Link to={`/product/${product._id}`}>
                    <button className="view">
                      <FaEye />
                    </button>
                  </Link>
                  <button
                    className="edit"
                    onClick={() => {
                      setProductToEdit(product);
                      setShowEditDialog(true);
                    }}
                  >
                    <FaEdit />
                  </button>

                  <button
                      className="delete"
                      onClick={() => handleDeleteClick(product._id)}
                    >
                      <FaTrash />
                    </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
              <option value={2}>2</option>
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
        </>
        )
       }
      </div>

      {showAddDialog && (
        <AddProduct
          onClose={() => setShowAddDialog(false)}
        />
      )}

      {showEditDialog && productToEdit && (
        <EditProduct
          product={productToEdit}
          onClose={() => {
            setShowEditDialog(false);
            setProductToEdit(null);
          }}
        />
      )}

        <ConfirmDialog
          open={confirmOpen}
          message={
            toDeleteId
              ? "Voulez-vous vraiment supprimer ce produit ?"
              : `Voulez-vous vraiment supprimer ${selectedProducts.length} produits ?`
          }
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />


    </div>
  );
};

export default Product;
