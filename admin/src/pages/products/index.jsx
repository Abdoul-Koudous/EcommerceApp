import React, { useEffect, useState, useContext, useCallback } from "react";
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
import HoverRating from "../../components/HoverRating/HoverRating";

const Product = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [productData, setProductData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const { openToast } = useContext(ToastContext);

  const [productCat, setProductCat] = useState("");
  const [productSubCat, setProductSubCat] = useState("");
  const [productThirdSubCat, setProductThirdSubCat] = useState("");

  const [allCategories, setAllCategories] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [allThirdSubCategories, setAllThirdSubCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilters = async () => {
      const res = await fetchDataFromApi("/api/product/getAllProducts");
      if (!res?.error) {
        const cats = [...new Set(res.products.map(p => p.catName))];
        const subs = [...new Set(res.products.map(p => p.subCat))];
        const thirds = [...new Set(res.products.map(p => p.thirdsubCat))];

        setAllCategories(cats.map(name => ({ _id: name, name })));
        setAllSubCategories(subs.map(name => ({ _id: name, name })));
        setAllThirdSubCategories(thirds.map(name => ({ _id: name, name })));
      }
    };

    fetchFilters();
  }, []);

  // ✅ extraite du useEffect via useCallback pour pouvoir être rappelée
  // manuellement (ex: après ajout/édition/suppression) sans dupliquer le code
  const fetchProducts = useCallback(async () => {
    setLoading(true);

    const res = await fetchDataFromApi(
      `/api/product?catName=${productCat}&subCat=${productSubCat}&thirdsubCat=${productThirdSubCat}&search=${searchTerm}&page=${currentPage}&perPage=${itemsPerPage}`
    );

    if (!res?.error) {
      setProductData(res.products || []);
      setTotalItems(res.total || 0);
    }

    setLoading(false);
  }, [productCat, productSubCat, productThirdSubCat, searchTerm, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const allSelected =
    productData.length > 0 &&
    productData.every(p => selectedProducts.includes(p._id));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(productData.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id)
        ? prev.filter(pid => pid !== id)
        : [...prev, id]
    );
  };

  const handleDeleteClick = (id) => {
    setToDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (toDeleteId) {
        const res = await deleteData(`/api/product/${toDeleteId}`);
        if (!res?.error) {
          setProductData(prev => prev.filter(p => p._id !== toDeleteId));
          openToast("success", "Produit supprimé");
        }
      } else if (selectedProducts.length > 0) {
        const res = await deleteData("/api/product/deleteMultipleProduct", {
          ids: selectedProducts
        });

        if (!res?.error) {
          setProductData(prev =>
            prev.filter(p => !selectedProducts.includes(p._id))
          );
          setSelectedProducts([]);
          openToast("success", "Produits supprimés");
        }
      }
    } catch (err) {
      openToast("error", "Erreur serveur");
    }

    setConfirmOpen(false);
    setToDeleteId(null);
  };

  return (
    <div className="ptbl-page">
      <div className="ptbl-header">
        <h2>Liste des produits</h2>

        <div className="ptbl-header-actions">
          {selectedProducts.length > 0 && (
            <button
              className="ptbl-delete-multiple-btn show"
              onClick={() => {
                setToDeleteId(null);
                setConfirmOpen(true);
              }}
            >
              <FaTrash />
              <span>Supprimer</span>
              <strong>{selectedProducts.length}</strong>
            </button>
          )}

          <button className="ptbl-export-btn"><FaDownload /> Exporter</button>

          <button className="ptbl-add-btn" onClick={() => setShowAddDialog(true)}>
            <FaPlus /> Ajouter un produit
          </button>
        </div>
      </div>

      <div className="ptbl-table-container">
        <div className="ptbl-filters-actions">
          <div className="ptbl-filters-left">
            <div className="ptbl-form-group">
              <label>Catégorie</label>
              <select value={productCat} onChange={e => {
                setProductCat(e.target.value);
                setCurrentPage(1);
              }}>
                <option value="">Toutes</option>
                {allCategories.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="ptbl-form-group">
              <label>Sous catégorie</label>
              <select value={productSubCat} onChange={e => {
                setProductSubCat(e.target.value);
                setCurrentPage(1);
              }}>
                <option value="">Toutes</option>
                {allSubCategories.map(s => (
                  <option key={s._id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="ptbl-form-group">
              <label>Dernier sous catégorie</label>
              <select value={productThirdSubCat} onChange={e => {
                setProductThirdSubCat(e.target.value);
                setCurrentPage(1);
              }}>
                <option value="">Toutes</option>
                {allThirdSubCategories.map(t => (
                  <option key={t._id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ptbl-search-bar">
            <FaSearch className="icon" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="ptbl-loading"><CircularProgress /></div>
        ) : productData.length === 0 ? (
          <div className="ptbl-no-results">
            Aucun produit correspondant aux filtres ou à la recherche.
          </div>
        ) : (
          <div className="ptbl-table-wrapper">
          <table className="ptbl-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allSelected} onChange={handleSelectAll} /></th>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Sous-catégorie</th>
                <th>Prix</th>
                <th>Note</th>
                <th>Ventes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {productData.map(product => {
                // ✅ Taux d'écoulement : part du stock initial déjà vendue.
                // "stock initial" = ventes déjà comptabilisées + ce qu'il reste
                // en stock actuellement, pour rester toujours entre 0 et 100%.
                const sold = product.sale || 0;
                const remaining = product.countIntStock || 0;
                const initialStock = sold + remaining;
                const salePct = initialStock > 0 ? Math.round((sold / initialStock) * 100) : 0;

                return (
                <tr key={product._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product._id)}
                      onChange={() => handleSelectOne(product._id)}
                    />
                  </td>
                  <td className="ptbl-product-info">
                    <Link to={`/product/${product._id}`}> <img src={product.images?.[0]} alt={product.name} /> </Link>
                    <div>
                      <Link to={`/product/${product._id}`}><h4>{product.name}</h4></Link>
                      <p>{product.brand}</p>
                    </div>
                  </td>

                  <td>{product.catName}</td>
                  <td>{product.subCat || "—"}</td>
                  <td className="ptbl-price">
                    {product.oldPrice > 0 && ( <div className="old-price">{product.oldPrice} FCFA</div> )}
                    <div className="current-price">{product.price} FCFA</div>
                  </td>
                  <td className="ptbl-rating">
                    <HoverRating rating={product.rating} />
                  </td>
                  <td className="ptbl-sales">
                    <span className="ptbl-sales-pct">{salePct}%</span>
                    <span className="ptbl-sales-count">({sold} ventes)</span>
                    <div className="progress-bar">
                      <div
                        className="progress"
                        style={{
                          width: `${salePct}%`,
                          background:
                            salePct < 40
                              ? "var(--color-danger)"
                              : salePct < 70
                              ? "var(--color-rating)"
                              : "var(--color-success)",
                        }}
                      />
                    </div>
                  </td>
                  <td className="ptbl-actions">
                    <Link to={`/product/${product._id}`}> <button className="ptbl-view-btn"> <FaEye /> </button> </Link>
                    <button
                      className="ptbl-edit-btn"
                      onClick={() => {
                        setProductToEdit(product);
                        setShowEditDialog(true);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button className="ptbl-delete-btn" onClick={() => handleDeleteClick(product._id)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
        

        <div className="ptbl-table-footer">
          <div className="ptbl-items-selector">
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
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* ✅ à la fermeture du dialogue (que ce soit après un ajout réussi ou
         une simple fermeture), on rafraîchit la liste — plus besoin de F5 */}
      {showAddDialog && (
        <AddProduct
          onClose={() => {
            setShowAddDialog(false);
            fetchProducts();
          }}
        />
      )}
      {showEditDialog && productToEdit && (
        <EditProduct
          product={productToEdit}
          onClose={() => {
            setShowEditDialog(false);
            fetchProducts();
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
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default Product;