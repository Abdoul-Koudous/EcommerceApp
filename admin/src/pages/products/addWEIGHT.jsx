import React, { useState, useEffect, useContext } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { fetchDataFromApi, postData, deleteData, editData } from "../utils/api";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import { ToastContext } from "../../context/ToastContext";
import "./productslist.scss";
import PaginationPro from "../../components/paginnationpro/paginationpro";
import { data } from "react-router-dom";

const AddWEIGHT = () => {
  const [weight, setWeight] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState("");
  const [selectedWeights, setSelectedWeights] = useState([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalItems, setTotalItems] = useState(0);
    const [name, setName] = useState("");
    const [editId, setEditId] = useState(null);


  const { openToast } = useContext(ToastContext);


  /* =========================
     FETCH WEIGHTS
  ========================== */
  const fetchWeights = async () => {
  setLoading(true);

  const res = await fetchDataFromApi(
    `/api/product/productWEIGHT?page=${currentPage}&perPage=${itemsPerPage}`
  );

  if (!res?.error) {
    setWeight(res.productWEIGHTs || []);
    setTotalItems(res.total || 0);
  }

  setLoading(false);
};

  useEffect(() => {
  fetchWeights();
}, [currentPage, itemsPerPage]);


  /* =========================
     AJOUT WEIGHT
  ========================== */
 

  /* =========================
     SELECTION
  ========================== */
  const allSelected =
    weight.length > 0 && weight.every(w => selectedWeights.includes(w._id));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedWeights(weight.map(w => w._id));
    } else {
      setSelectedWeights([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedWeights(prev =>
      prev.includes(id)
        ? prev.filter(wid => wid !== id)
        : [...prev, id]
    );
  };

  /* =========================
     SUPPRESSION (SIMPLE + MULTIPLE)
  ========================== */
  const handleDeleteClick = (id) => {
    setToDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (toDeleteId) {
        const res = await deleteData(`/api/product/productWEIGHT/${toDeleteId}`);
        if (!res?.error) {
          setWeight(prev => prev.filter(w => w._id !== toDeleteId));
          openToast("success", res?.message || "WEIGHT supprimée");
        }
      } else if (selectedWeights.length > 0) {
        const res = await deleteData(
          "/api/product/deleteMultipleProductWEIGHT",
          { ids: selectedWeights }
        );

        if (!res?.error) {
          setWeight(prev => prev.filter(w => !selectedWeights.includes(w._id)));
          setSelectedWeights([]);
          openToast("success", res?.message || "WEIGHTs supprimées");
        }
      }
    } catch (err) {
      openToast("error", "Erreur serveur");
    }

    setConfirmOpen(false);
    setToDeleteId(null);
  };

  const editItem = async (id) => {
  try {
    const res = await fetchDataFromApi(`/api/product/productWEIGHT/${id}`);
    if (!res?.error && res.productWEIGHT) {
      setNewWeight(res.productWEIGHT.name);
      setEditId(id);
    } else {
      openToast("error", "Impossible de charger la WEIGHT");
    }
  } catch (err) {
    openToast("error", "Erreur serveur");
  }
};


const handleAddOrEditWeight = async () => {
  if (!newWeight.trim()) return;

  setLoading(true);

  try {
    let res;

    if (editId) {
      // ===== EDIT =====
      res = await editData(
        `/api/product/updateProductWEIGHT/${editId}`,
        { name: newWeight }
        );

    } else {
      // ===== ADD =====
      res = await postData(
        "/api/product/productWEIGHT/create",
        { name: newWeight }
      );
    }

    if (!res?.error) {
      openToast(
        "success",
        res?.message || (editId ? "WEIGHT modifiée" : "WEIGHT ajoutée")
      );

      setNewWeight("");
      setEditId(null);
      fetchWeights(); // refresh liste
    } else {
      openToast("error", res?.message || "Erreur");
    }
  } catch (err) {
    openToast("error", "Erreur serveur");
  }

  setLoading(false);
};


  return (
    <div className="admin-pages">
      {/* ================= HEADER ================= */}
      <div className="header">
        <h2>Gestion des WEIGHT</h2>

        <div className="header-actions">
          {selectedWeights.length > 0 && (
            <button
              className="delete-multiple-btn show"
              onClick={() => {
                setToDeleteId(null);
                setConfirmOpen(true);
              }}
            >
              <FaTrash />
              <span>Supprimer</span>
              <strong>{selectedWeights.length}</strong>
            </button>
          )}

          <input
            type="text"
            placeholder="Nom de la WEIGHT"
            value={newWeight}
            onChange={e => setNewWeight(e.target.value)}
            className="category-select"
          />

          <button onClick={handleAddOrEditWeight} className="add-btn">
            <FaPlus /> {editId ? "Mettre à jour" : "Ajouter"}
            </button>


        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="product-table-container">
        {loading ? (
          <div className="loading"><CircularProgress /></div>
        ) : weight.length === 0 ? (
          <div className="no-results">Aucune WEIGHT trouvée</div>
        ) : (
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
                <th>Nom</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
             {weight.map((w) => (
              <tr key={w._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedWeights.includes(w._id)}
                    onChange={() => handleSelectOne(w._id)}
                  />
                </td>
                <td>{w.name}</td>
                <td className="actions">
                  <button className="edit" onClick={() => editItem(w._id)}><FaEdit /></button>
                  <button className="delete" onClick={() => handleDeleteClick(w._id)}><FaTrash /></button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        )}
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

      {/* ================= CONFIRM ================= */}
      <ConfirmDialog
        open={confirmOpen}
        message={
          toDeleteId
            ? "Voulez-vous vraiment supprimer cette WEIGHT ?"
            : `Voulez-vous vraiment supprimer ${selectedWeights.length} WEIGHT(s) ?`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default AddWEIGHT;
