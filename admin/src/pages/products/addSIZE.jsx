import React, { useState, useEffect, useContext } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { fetchDataFromApi, postData, deleteData, editData } from "../utils/api";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import { ToastContext } from "../../context/ToastContext";
import "./productslist.scss";
import PaginationPro from "../../components/paginnationpro/paginationpro";
import { data } from "react-router-dom";

const AddSIZE = () => {
  const [size, setSize] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSize, setNewSize] = useState("");
  const [selectedSizes, setSelectedSizes] = useState([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalItems, setTotalItems] = useState(0);
    const [name, setName] = useState("");
    const [editId, setEditId] = useState(null);


  const { openToast } = useContext(ToastContext);


  /* =========================
     FETCH SIZES
  ========================== */
  const fetchSizes = async () => {
  setLoading(true);

  const res = await fetchDataFromApi(
    `/api/product/productSIZE?page=${currentPage}&perPage=${itemsPerPage}`
  );

  if (!res?.error) {
    setSize(res.productSIZEs || []);
    setTotalItems(res.total || 0);
  }

  setLoading(false);
};

  useEffect(() => {
  fetchSizes();
}, [currentPage, itemsPerPage]);

  /* =========================
     SELECTION
  ========================== */
  const allSelected =
    size.length > 0 && size.every(s => selectedSizes.includes(s._id));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSizes(size.map(s => s._id));
    } else {
      setSelectedSizes([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedSizes(prev =>
      prev.includes(id)
        ? prev.filter(sid => sid !== id)
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
        const res = await deleteData(`/api/product/productSIZE/${toDeleteId}`);
        if (!res?.error) {
          setSize(prev => prev.filter(s => s._id !== toDeleteId));
          openToast("success", res?.message || "SIZE supprimée");
        }
      } else if (selectedSizes.length > 0) {
        const res = await deleteData(
          "/api/product/deleteMultipleProductSIZE",
          { ids: selectedSizes }
        );

        if (!res?.error) {
          setSize(prev => prev.filter(s => !selectedSizes.includes(s._id)));
          setSelectedSizes([]);
          openToast("success", res?.message || "SIZEs supprimées");
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
    const res = await fetchDataFromApi(`/api/product/productSIZE/${id}`);
    if (!res?.error && res.productSIZE) {
      setNewSize(res.productSIZE.name);
      setEditId(id);
    } else {
      openToast("error", "Impossible de charger la SIZE");
    }
  } catch (err) {
    openToast("error", "Erreur serveur");
  }
};


const handleAddOrEditSize = async () => {
  if (!newSize.trim()) return;

  setLoading(true);

  try {
    let res;

    if (editId) {
      // ===== EDIT =====
      res = await editData(
        `/api/product/updateProductSIZE/${editId}`,
        { name: newSize }
        );

    } else {
      // ===== ADD =====
      res = await postData(
        "/api/product/productSIZE/create",
        { name: newSize }
      );
    }

    if (!res?.error) {
      openToast(
        "success",
        res?.message || (editId ? "SIZE modifiée" : "SIZE ajoutée")
      );

      setNewSize("");
      setEditId(null);
      fetchSizes(); // refresh liste
    } else {
      openToast("error", res?.message || "Erreur");
    }
  } catch (err) {
    openToast("error", "Erreur serveur");
  }

  setLoading(false);
};


  return (
    <div className="crc-page">
      {/* ================= HEADER ================= */}
      <div className="crc-header">
        <h2>Gestion des SIZES</h2>

        <div className="crc-header-actions">
          {selectedSizes.length > 0 && (
            <button
              className="crc-delete-multiple-btn show"
              onClick={() => {
                setToDeleteId(null);
                setConfirmOpen(true);
              }}
            >
              <FaTrash />
              <span>Supprimer</span>
              <strong>{selectedSizes.length}</strong>
            </button>
          )}

          <input
            type="text"
            placeholder="Nom de la SIZE"
            value={newSize}
            onChange={e => setNewSize(e.target.value)}
            className="crc-name-input"
          />

          <button onClick={handleAddOrEditSize} className="crc-add-btn">
            <FaPlus /> {editId ? "Mettre à jour" : "Ajouter"}
            </button>


        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="crc-table-container">
        {loading ? (
          <div className="crc-loading"><CircularProgress /></div>
        ) : size.length === 0 ? (
          <div className="crc-no-results">Aucune SIZE trouvée</div>
        ) : (
          <table className="crc-table">
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
             {size.map((w) => (
              <tr key={w._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedSizes.includes(w._id)}
                    onChange={() => handleSelectOne(w._id)}
                  />
                </td>
                <td>{w.name}</td>
                <td className="crc-actions">
                  <button className="crc-edit-btn" onClick={() => editItem(w._id)}><FaEdit /></button>
                  <button className="crc-delete-btn" onClick={() => handleDeleteClick(w._id)}><FaTrash /></button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        )}
        <div className="crc-table-footer">
        <div className="crc-items-selector">
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
            ? "Voulez-vous vraiment supprimer cette SIZE ?"
            : `Voulez-vous vraiment supprimer ${selectedSizes.length} SIZE(s) ?`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default AddSIZE;