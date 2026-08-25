import React, { useState, useEffect, useContext } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./homeSlide.scss";
import { deleteData, fetchDataFromApi } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import EditHomeSlide from "./EditHomeSlide";
import AddHomeSlide from "./addHomeSlide";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import PaginationPro from "../../components/paginnationpro/paginationpro";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
};

const HomeSlidePage = () => {
  const [slides, setSlides] = useState([]);
  const [selected, setSelected] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const { openToast } = useContext(ToastContext);
  const [currentSlide, setCurrentSlide] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [loadingSlides, setLoadingSlides] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  const loadSlides = async () => {
    setLoadingSlides(true);
    try {
      const res = await fetchDataFromApi(
        `/api/homeSlide?page=${currentPage}&perPage=${itemsPerPage}`
      );
      setSlides(res?.data || []);
      setTotalItems(res?.total || 0);
    } catch (err) {
      openToast("error", "Erreur récupération des slides");
    } finally {
      setLoadingSlides(false);
    }
  };

  useEffect(() => {
    loadSlides();
  }, [currentPage, itemsPerPage]);

  const handleDeleteClick = (_id) => {
    setToDeleteId(_id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (toDeleteId) {
        const res = await deleteData(`/api/homeSlide/${toDeleteId}`);
        if (res?.success) {
          setSlides((prev) => prev.filter((slide) => slide._id !== toDeleteId));
          openToast("success", res.message || "Slide supprimé avec succès");
        } else {
          openToast("error", res?.message || "Erreur suppression slide");
        }
      } else if (selected.length > 0) {
        const res = await deleteData("/api/homeSlide/deleteMultipleSlides", {
          ids: selected,
        });
        if (!res?.error) {
          setSlides((prev) => prev.filter((slide) => !selected.includes(slide._id)));
          setSelected([]);
          openToast("success", res.message || "Slides supprimés avec succès");
        } else {
          openToast("error", res.message || "Erreur suppression slides");
        }
      }
    } catch {
      openToast("error", "Erreur suppression slide(s)");
    }

    setToDeleteId(null);
    setConfirmOpen(false);
  };

  const handleCancelDelete = () => {
    setToDeleteId(null);
    setConfirmOpen(false);
  };

  const toggleSelect = (_id) => {
    setSelected((prev) =>
      prev.includes(_id) ? prev.filter((id) => id !== _id) : [...prev, _id]
    );
  };

  const toggleSelectAll = (e) => {
    setSelected(e.target.checked ? slides.map((s) => s._id) : []);
  };

  const handleEdit = (slide) => {
    setCurrentSlide(slide);
    setOpenEdit(true);
  };

  // Un slide est "en diffusion" seulement si actif ET dans sa fenêtre de dates
  const isCurrentlyLive = (slide) => {
    if (!slide.isActive) return false;
    const now = new Date();
    if (slide.startDate && new Date(slide.startDate) > now) return false;
    if (slide.endDate && new Date(slide.endDate) < now) return false;
    return true;
  };

  return (
    <div className="hsl-page">
      <div className="hsl-header">
        <h2>Liste des Slides</h2>
        <div className="hsl-actions">
          {selected.length > 0 && (
            <button
              className="hsl-btn hsl-btn-delete-multiple"
              onClick={() => {
                setToDeleteId(null);
                setConfirmOpen(true);
              }}
            >
              <FaTrash /> Supprimer ({selected.length})
            </button>
          )}
          <button className="hsl-btn hsl-btn-add" onClick={() => setOpenAdd(true)}>
            Ajouter
          </button>
        </div>
      </div>

      {loadingSlides ? (
        <CircularProgress />
      ) : (
        <div className="hsl-table-container">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={slides.length > 0 && selected.length === slides.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Image</th>
                <th>Titre</th>
                <th>Badge</th>
                <th>Diffusion</th>
                <th>Ordre</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slides.map((slide) => (
                <tr key={slide._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(slide._id)}
                      onChange={() => toggleSelect(slide._id)}
                    />
                  </td>
                  <td>
                    <div className="hsl-thumb">
                      <img src={slide.images?.[0]} alt={slide.title || "Slide"} />
                    </div>
                  </td>
                  <td>
                    <div className="hsl-title-cell">
                      <span className="hsl-title-main">{slide.title || "—"}</span>
                      {slide.subtitle && (
                        <span className="hsl-title-sub">{slide.subtitle}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {slide.badgeText ? (
                      <span className={`hsl-badge hsl-badge-${slide.badgeColor || "accent"}`}>
                        {slide.badgeText}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className="hsl-dates">
                      {formatDate(slide.startDate)} → {formatDate(slide.endDate)}
                    </span>
                  </td>
                  <td>{slide.order ?? 0}</td>
                  <td>
                    <span
                      className={`hsl-status ${
                        isCurrentlyLive(slide) ? "hsl-status-live" : "hsl-status-off"
                      }`}
                    >
                      {isCurrentlyLive(slide) ? "En ligne" : "Hors ligne"}
                    </span>
                  </td>
                  <td>
                    <FaEdit className="hsl-icon hsl-icon-edit" onClick={() => handleEdit(slide)} />
                    <FaTrash
                      className="hsl-icon hsl-icon-delete"
                      onClick={() => handleDeleteClick(slide._id)}
                    />
                  </td>
                </tr>
              ))}
              {slides.length === 0 && (
                <tr>
                  <td colSpan={8}>Aucun slide trouvé</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="hsl-table-footer">
            <div className="hsl-items-selector">
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
      )}

      {openAdd && (
        <AddHomeSlide
          onClose={() => setOpenAdd(false)}
          onAddSlide={() => loadSlides()}
        />
      )}

      {openEdit && currentSlide && (
        <EditHomeSlide
          slide={currentSlide}
          onClose={() => {
            setOpenEdit(false);
            setCurrentSlide(null);
          }}
          onUpdateSlide={() => loadSlides()}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        message={
          toDeleteId
            ? "Voulez-vous vraiment supprimer ce slide ?"
            : `Voulez-vous vraiment supprimer ${selected.length} slide(s) ?`
        }
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default HomeSlidePage;