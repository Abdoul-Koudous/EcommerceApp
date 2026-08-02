import React, { useEffect, useState, useContext } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./bannerV1List.scss";
import { deleteData, fetchDataFromApi } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import PaginationPro from "../../components/paginnationpro/paginationpro";
import AddBannersV1 from "./addBannersV1";
import EditBannersV1 from "./editBannersV1";

const BannerV1List = () => {
  const { openToast } = useContext(ToastContext);

  const [banners, setBanners] = useState([]);
  const [selected, setSelected] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await fetchDataFromApi(
        `/api/bannerV1?page=${currentPage}&perPage=${itemsPerPage}`
      );

      setBanners(res?.data || []);
      setTotalItems(res?.total || 0);
    } catch (err) {
      openToast("error", "Erreur chargement bannières");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, [currentPage, itemsPerPage]);

  const handleDeleteClick = (id) => {
    setToDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (toDeleteId) {
        const res = await deleteData(`/api/bannerV1/${toDeleteId}`);
        if (res.success) {
          setBanners((prev) => prev.filter((b) => b._id !== toDeleteId));
          openToast("success", "Bannière supprimée");
        }
      } else if (selected.length > 0) {
        for (let id of selected) {
          await deleteData(`/api/bannerV1/${id}`);
        }
        setBanners((prev) => prev.filter((b) => !selected.includes(b._id)));
        setSelected([]);
        openToast("success", "Bannières supprimées");
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

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(banners.map((b) => b._id));
    } else {
      setSelected([]);
    }
  };

  const handleEdit = (banner) => {
    setCurrentBanner(banner);
    setOpenEdit(true);
  };

  return (
    <div className="bnr-page">
      {/* HEADER */}
      <div className="bnr-header">
        <h2>Liste des Bannières</h2>

        <div className="bnr-actions">
          {selected.length > 0 && (
            <button
              className="bnr-btn bnr-btn-delete-multiple"
              onClick={() => setConfirmOpen(true)}
            >
              <FaTrash /> Supprimer ({selected.length})
            </button>
          )}

          <button className="bnr-btn bnr-btn-add" onClick={() => setOpenAdd(true)}>
            Ajouter
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <CircularProgress />
      ) : (
        <div className="bnr-table-container">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      banners.length > 0 && selected.length === banners.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Image</th>
                <th>Titre</th>
                <th>Prix</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {banners.map((banner) => (
                <tr key={banner._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(banner._id)}
                      onChange={() => toggleSelect(banner._id)}
                    />
                  </td>

                  <td>
                    <div className="bnr-thumb">
                      <img src={banner.images?.[0]} alt="" />
                    </div>
                  </td>

                  <td>{banner.bannerTitle}</td>
                  <td>{banner.price} FCFA</td>

                  <td>
                    <FaEdit
                      className="bnr-icon bnr-icon-edit"
                      onClick={() => handleEdit(banner)}
                    />
                    <FaTrash
                      className="bnr-icon bnr-icon-delete"
                      onClick={() => handleDeleteClick(banner._id)}
                    />
                  </td>
                </tr>
              ))}

              {banners.length === 0 && (
                <tr>
                  <td colSpan={5}>Aucune bannière</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div className="bnr-table-footer">
            <div className="bnr-items-selector">
              <label>Afficher</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
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

      {/* ADD */}
      {openAdd && (
        <AddBannersV1
          onClose={() => setOpenAdd(false)}
          onAddBanner={(newBanner) =>
            setBanners((prev) => [newBanner, ...prev])
          }
        />
      )}

      {/* EDIT */}
      {openEdit && currentBanner && (
        <EditBannersV1
          banner={currentBanner}
          onClose={() => {
            setOpenEdit(false);
            setCurrentBanner(null);
          }}
          onUpdateBanner={() => loadBanners()}
        />
      )}

      {/* CONFIRM */}
      <ConfirmDialog
        open={confirmOpen}
        message={
          toDeleteId
            ? "Supprimer cette bannière ?"
            : `Supprimer ${selected.length} bannière(s) ?`
        }
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default BannerV1List;