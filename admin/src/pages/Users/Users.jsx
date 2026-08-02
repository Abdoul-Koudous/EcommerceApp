import React, { useEffect, useState, useCallback, useContext } from "react";
import { FaSearch, FaTrash } from "react-icons/fa";

import "./users.scss";
import { deleteData, fetchDataFromApi } from "../utils/api";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import PaginationPro from "../../components/paginnationpro/paginationpro";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import { ToastContext } from "../../context/ToastContext";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const { openToast } = useContext(ToastContext);

  const loadUsers = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchDataFromApi(
      `/api/users/lists?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    )
      .then((res) => {
        if (res?.success) {
          setUsers(res.data || []);
          setTotalCount(res.totalCount || 0);
        } else {
          setUsers([]);
          setTotalCount(0);
          setError(
            res?.message || "Erreur lors du chargement des utilisateurs",
          );
        }
      })
      .catch(() => {
        setUsers([]);
        setTotalCount(0);
        setError("Erreur réseau, veuillez réessayer");
      })
      .finally(() => setLoading(false));
  }, [page, limit, search]);

  useEffect(() => {
    const timeout = setTimeout(loadUsers, 400);
    return () => clearTimeout(timeout);
  }, [loadUsers]);

  const toggleSelectAll = (e) => {
    setSelected(e.target.checked ? users.map((u) => u._id) : []);
  };

  const toggleSelectOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleDeleteClick = (id) => {
    setToDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (toDeleteId) {
        const res = await deleteData(`/api/users/${toDeleteId}`);
        if (res?.success) {
          setUsers((prev) => prev.filter((u) => u._id !== toDeleteId));
          setTotalCount((prev) => Math.max(0, prev - 1));
          openToast("success", "Utilisateur supprimé");
        } else {
          openToast("error", res?.message || "Erreur lors de la suppression");
        }
      } else if (selected.length > 0) {
        const res = await deleteData("/api/users/deleteMultipleUsers", {
          ids: selected,
        });

        if (res?.success) {
          setUsers((prev) => prev.filter((u) => !selected.includes(u._id)));
          setTotalCount((prev) => Math.max(0, prev - selected.length));
          setSelected([]);
          openToast("success", "Utilisateurs supprimés");
        } else {
          openToast("error", res?.message || "Erreur lors de la suppression");
        }
      }
    } catch (err) {
      openToast("error", "Erreur serveur");
    }

    setConfirmOpen(false);
    setToDeleteId(null);
  };

  return (
    <div className="usr-page">
      <div className="usr-header">
        <h2>Liste des utilisateurs</h2>

        <div className="usr-header-actions">
          {selected.length > 0 && (
            <button
              className="usr-delete-multiple-btn show"
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

          <div className="usr-search-box">
            <FaSearch className="usr-search-icon" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {error && <div className="usr-error-banner">{error}</div>}

      <div className="usr-table-wrapper">
        {loading ? (
          <div className="usr-table-loading">
            <CircularProgress />
          </div>
        ) : (
          <table className="usr-table">
            <thead>
              <tr>
                <th className="usr-checkbox-col">
                  <input
                    type="checkbox"
                    checked={
                      users.length > 0 && selected.length === users.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Image</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Email vérifié</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="usr-empty-row">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(user._id)}
                        onChange={() => toggleSelectOne(user._id)}
                      />
                    </td>
                    <td>
                      <div className="usr-avatar">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} />
                        ) : (
                          <span className="usr-avatar-fallback">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.mobile || "-"}</td>
                    <td>
                      <span
                        className={`usr-status-badge ${user.verify_email ? "active" : "inactive"}`}
                      >
                        {user.verify_email ? "Vérifié" : "Non vérifié"}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td className="usr-actions">
                      <button onClick={() => handleDeleteClick(user._id)}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="usr-table-footer">
        <div className="usr-page-size">
          Afficher
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          éléments
        </div>

        <PaginationPro
          currentPage={page}
          totalItems={totalCount}
          itemsPerPage={limit}
          onPageChange={setPage}
        />

        <div className="usr-total-count">{totalCount} utilisateur(s)</div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        message={
          toDeleteId
            ? "Voulez-vous vraiment supprimer cet utilisateur ?"
            : `Voulez-vous vraiment supprimer ${selected.length} utilisateurs ?`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default Users;