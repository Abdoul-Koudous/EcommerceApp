import React, { useState, useEffect, useContext } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./categories.scss";
import AddCategory from "./AddCategory";
import EditCategory from "./EditCategory";
import { deleteData, fetchDataFromApi } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import PaginationPro from "../../components/paginnationpro/paginationpro";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

const CategoriesPage = () => {
  const [catData, setCatData] = useState([]);
  const [selected, setSelected] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const { openToast } = useContext(ToastContext);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetchDataFromApi(
        `/api/category?page=${currentPage}&perPage=${itemsPerPage}`
      );

      setCatData(res?.data || []);
      setTotalItems(res?.total || 0);

    } catch {
      openToast("error", "Erreur récupération catégories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [currentPage, itemsPerPage]);

  const handleDeleteClick = (_id) => {
    setToDeleteId(_id);
    setConfirmOpen(true);
  };

  // ✅ suppression un par un (patron BannerV1) — pas d'endpoint deleteMultipleCategories côté backend
  const handleConfirmDelete = async () => {
    try {
      if (toDeleteId) {
        const res = await deleteData(`/api/category/${toDeleteId}`);
        if (res?.success) {
          setCatData(prev => prev.filter(cat => cat._id !== toDeleteId));
          openToast("success", res.message || "Catégorie supprimée");
        } else {
          openToast("error", res.message || "Erreur suppression");
        }
      } else if (selected.length > 0) {
        for (let id of selected) {
          await deleteData(`/api/category/${id}`);
        }
        setCatData(prev => prev.filter(cat => !selected.includes(cat._id)));
        setSelected([]);
        openToast("success", "Catégories supprimées");
      }
    } catch {
      openToast("error", "Erreur suppression");
    }

    setToDeleteId(null);
    setConfirmOpen(false);
  };

  const handleCancelDelete = () => {
    setToDeleteId(null);
    setConfirmOpen(false);
  };

  const toggleSelect = (_id) => {
    setSelected(prev =>
      prev.includes(_id)
        ? prev.filter(id => id !== _id)
        : [...prev, _id]
    );
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(catData.map(c => c._id));
    } else {
      setSelected([]);
    }
  };

  const handleEdit = (cat) => {
    setCurrentCategory(cat);
    setOpenEdit(true);
  };

  return (
    <div className="ctg-page">
      <div className="ctg-header">
        <h2>Liste des catégories</h2>
        <div className="ctg-actions">
          {/* ✅ ajouté */}
          {selected.length > 0 && (
            <button
              className="ctg-btn-delete-multiple"
              onClick={() => {
                setToDeleteId(null);
                setConfirmOpen(true);
              }}
            >
              <FaTrash />
              <span>Supprimer</span>
              <strong>{selected.length}</strong>
            </button>
          )}

          <button className="ctg-btn ctg-btn-add" onClick={() => setOpenAdd(true)}>
            Ajouter
          </button>
        </div>
      </div>

      {loading ? (
        <CircularProgress />
      ) : (
        <div className="ctg-table-container">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={catData.length > 0 && selected.length === catData.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Image</th>
                <th>Nom</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {catData.map((cat) => (
                <tr key={cat._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(cat._id)}
                      onChange={() => toggleSelect(cat._id)}
                    />
                  </td>
                  <td>
                    <div className="ctg-thumb">
                      <img src={cat.images?.[0]} alt={cat.name} />
                    </div>
                  </td>
                  <td>{cat.name}</td>
                  <td>
                    <FaEdit className="ctg-icon ctg-icon-edit" onClick={() => handleEdit(cat)} />
                    <FaTrash className="ctg-icon ctg-icon-delete" onClick={() => handleDeleteClick(cat._id)} />
                  </td>
                </tr>
              ))}

              {catData.length === 0 && (
                <tr>
                  <td colSpan={4}>Aucune catégorie trouvée</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="ctg-table-footer">
            <div className="ctg-items-selector">
              <label>Afficher</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={2}>2</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
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
      )}

      {openAdd && (
        <AddCategory
          onClose={() => setOpenAdd(false)}
          onAddCategory={() => loadCategories()}
        />
      )}

      {openEdit && currentCategory && (
        <EditCategory
          category={currentCategory}
          onClose={() => {
            setOpenEdit(false);
            setCurrentCategory(null);
          }}
          onUpdateCategory={() => loadCategories()}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        message={
          toDeleteId
            ? "Voulez-vous vraiment supprimer cette catégorie ?"
            : `Voulez-vous vraiment supprimer ${selected.length} catégorie(s) ?`
        }
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default CategoriesPage;