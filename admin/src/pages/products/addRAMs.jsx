import React, { useState, useEffect, useContext } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import { fetchDataFromApi, postData, deleteData, editData } from "../utils/api";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import { ToastContext } from "../../context/ToastContext";
import "./productslist.scss";
import PaginationPro from "../../components/paginnationpro/paginationpro";
import { data } from "react-router-dom";

const AddRAMs = () => {
  const [rams, setRams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRam, setNewRam] = useState("");
  const [selectedRams, setSelectedRams] = useState([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [totalItems, setTotalItems] = useState(0);
    const [name, setName] = useState("");
    const [editId, setEditId] = useState(null);


  const { openToast } = useContext(ToastContext);


  /* =========================
     FETCH RAMS
  ========================== */
  const fetchRams = async () => {
  setLoading(true);

  const res = await fetchDataFromApi(
    `/api/product/productRAM?page=${currentPage}&perPage=${itemsPerPage}`
  );

  if (!res?.error) {
    setRams(res.productRAMs || []);
    setTotalItems(res.total || 0);
  }

  setLoading(false);
};

  useEffect(() => {
  fetchRams();
}, [currentPage, itemsPerPage]);

  /* =========================
     SELECTION
  ========================== */
  const allSelected =
    rams.length > 0 && rams.every(r => selectedRams.includes(r._id));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRams(rams.map(r => r._id));
    } else {
      setSelectedRams([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedRams(prev =>
      prev.includes(id)
        ? prev.filter(rid => rid !== id)
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
        const res = await deleteData(`/api/product/productRAM/${toDeleteId}`);
        if (!res?.error) {
          setRams(prev => prev.filter(r => r._id !== toDeleteId));
          openToast("success", res?.message || "RAM supprimée");
        }
      } else if (selectedRams.length > 0) {
        const res = await deleteData(
          "/api/product/deleteMultipleProductRAM",
          { ids: selectedRams }
        );

        if (!res?.error) {
          setRams(prev => prev.filter(r => !selectedRams.includes(r._id)));
          setSelectedRams([]);
          openToast("success", res?.message || "RAMs supprimées");
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
    const res = await fetchDataFromApi(`/api/product/productRAM/${id}`);
    if (!res?.error && res.productRAM) {
      setNewRam(res.productRAM.name);
      setEditId(id);
    } else {
      openToast("error", "Impossible de charger la RAM");
    }
  } catch {
    openToast("error", "Erreur serveur");
  }
};


const handleAddOrEditRam = async () => {
  if (!newRam.trim()) return;

  setLoading(true);

  try {
    let res;

    if (editId) {
      // ===== EDIT =====
      res = await editData(
        `/api/product/updateProductRAM/${editId}`,
        { name: newRam }
        );

    } else {
      // ===== ADD =====
      res = await postData(
        "/api/product/productRAM/create",
        { name: newRam }
      );
    }

    if (!res?.error) {
      openToast(
        "success",
        res?.message || (editId ? "RAM modifiée" : "RAM ajoutée")
      );

      setNewRam("");
      setEditId(null);
      fetchRams(); // refresh liste
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
        <h2>Gestion des RAM</h2>

        <div className="crc-header-actions">
          {selectedRams.length > 0 && (
            <button
              className="crc-delete-multiple-btn show"
              onClick={() => {
                setToDeleteId(null);
                setConfirmOpen(true);
              }}
            >
              <FaTrash />
              <span>Supprimer</span>
              <strong>{selectedRams.length}</strong>
            </button>
          )}

          <input
            type="text"
            placeholder="Nom de la RAM"
            value={newRam}
            onChange={e => setNewRam(e.target.value)}
            className="crc-name-input"
          />

          <button onClick={handleAddOrEditRam} className="crc-add-btn">
            <FaPlus /> {editId ? "Mettre à jour" : "Ajouter"}
            </button>


        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="crc-table-container">
        {loading ? (
          <div className="crc-loading"><CircularProgress /></div>
        ) : rams.length === 0 ? (
          <div className="crc-no-results">Aucune RAM trouvée</div>
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
              {rams.map(ram => (
                <tr key={ram._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRams.includes(ram._id)}
                      onChange={() => handleSelectOne(ram._id)}
                    />
                  </td>
                  <td>{ram.name}</td>
                  <td className="crc-actions">
                    <button className="crc-edit-btn" onClick={() => editItem(ram._id)}><FaEdit /></button>
                    <button
                      className="crc-delete-btn"
                      onClick={() => handleDeleteClick(ram._id)}
                    >
                      <FaTrash />
                    </button>
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
            ? "Voulez-vous vraiment supprimer cette RAM ?"
            : `Voulez-vous vraiment supprimer ${selectedRams.length} RAM(s) ?`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default AddRAMs;