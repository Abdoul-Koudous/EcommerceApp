// 📁 Fichier à créer : admin/src/pages/help-faq/HelpFaqList.jsx

import React, { useEffect, useState, useContext, useCallback } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import "./helpfaqadmin.scss";
import PaginationPro from "../../components/paginnationpro/paginationpro";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import AddFaq from "./AddFaq";
import EditFaq from "./EditFaq";
import { fetchDataFromApi, deleteData, editData } from "../utils/api";
import { getIconComponent } from "../utils/iconOptions";
import { ToastContext } from "../../context/ToastContext";

const HelpFaqList = () => {
  const { openToast } = useContext(ToastContext);

  const [faqsData, setFaqsData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState(["Tous"]);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [faqToEdit, setFaqToEdit] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [toDeleteQuestion, setToDeleteQuestion] = useState("");

  useEffect(() => {
    fetchDataFromApi("/api/help-faq/getCategories").then((res) => {
      if (!res?.error) {
        setCategories(["Tous", ...(res.categories || []).map((c) => c.title)]);
      }
    });
  }, []);

  // ✅ route admin (getAll/admin) pour voir aussi les brouillons, contrairement
  // à /api/help-faq/getAll qui ne renvoie que les questions publiées côté public
  const fetchFaqs = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    params.set("page", currentPage);
    params.set("perPage", itemsPerPage);
    if (activeCategory !== "Tous") params.set("category", activeCategory);
    if (searchTerm.trim()) params.set("search", searchTerm.trim());

    const res = await fetchDataFromApi(
      `/api/help-faq/admin/getAll?${params.toString()}`
    );

    if (!res?.error) {
      setFaqsData(res.data || []);
      setTotalItems(res.total || 0);
    } else {
      openToast("error", "Échec du chargement des questions");
      setFaqsData([]);
      setTotalItems(0);
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, activeCategory, searchTerm]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleDeleteClick = (id, question) => {
    setToDeleteId(id);
    setToDeleteQuestion(question);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await deleteData(`/api/help-faq/delete/${toDeleteId}`);

      if (!res?.error) {
        openToast("success", "Question supprimée");

        if (faqsData.length === 1 && currentPage > 1) {
          setCurrentPage((p) => p - 1);
        } else {
          fetchFaqs();
        }
      } else {
        openToast("error", res.message || "Échec de la suppression");
      }
    } catch (error) {
      openToast("error", "Échec de la suppression");
    }

    setConfirmOpen(false);
    setToDeleteId(null);
  };

  const toggleStatus = async (faq) => {
    const newStatus = faq.status === "published" ? "draft" : "published";
    const res = await editData(`/api/help-faq/update/${faq._id}`, {
      status: newStatus,
    });

    if (!res?.error) {
      openToast(
        "success",
        newStatus === "published" ? "Question publiée" : "Repassée en brouillon"
      );
      fetchFaqs();
    } else {
      openToast("error", res.message || "Échec de la mise à jour");
    }
  };

  return (
    <div className="hlpadm-page">
      <div className="hlpadm-header">
        <h2>Questions du centre d'aide</h2>

        <button className="hlpadm-add-btn" onClick={() => setShowAddDialog(true)}>
          <FaPlus /> Nouvelle question
        </button>
      </div>

      <div className="hlpadm-toolbar">
        <div className="hlpadm-search-bar">
          <FaSearch className="icon" />
          <input
            type="text"
            placeholder="Rechercher une question..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="hlpadm-categories">
          {categories.map((cat) => (
            <button
              key={cat}
              className={activeCategory === cat ? "active" : ""}
              onClick={() => {
                setActiveCategory(cat);
                setCurrentPage(1);
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="hlpadm-loading">
          <CircularProgress />
        </div>
      ) : faqsData.length === 0 ? (
        <div className="hlpadm-empty">Aucune question trouvée.</div>
      ) : (
        <div className="hlpadm-table-wrapper">
          <table className="hlpadm-table">
            <thead>
              <tr>
                <th>Icône</th>
                <th>Catégorie</th>
                <th>Question</th>
                <th>Statut</th>
                <th>Ordre</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {faqsData.map((faq) => {
                const CatIcon = getIconComponent(faq.categoryIcon);
                return (
                  <tr key={faq._id}>
                    <td>
                      <CatIcon />
                    </td>

                    <td>{faq.category}</td>
                    <td>{faq.question}</td>

                    <td>
                      <button
                        type="button"
                        className={`hlpadm-status-badge ${faq.status}`}
                        onClick={() => toggleStatus(faq)}
                        title="Cliquer pour changer le statut"
                      >
                        {faq.status === "published" ? "Publié" : "Brouillon"}
                      </button>
                    </td>

                    <td>{faq.order ?? 0}</td>

                    <td className="hlpadm-actions">
                      <button
                        className="hlpadm-edit-btn"
                        onClick={() => {
                          setFaqToEdit(faq);
                          setShowEditDialog(true);
                        }}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="hlpadm-delete-btn"
                        onClick={() => handleDeleteClick(faq._id, faq.question)}
                      >
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

      <div className="hlpadm-table-footer">
        <div className="hlpadm-items-selector">
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

      {showAddDialog && (
        <AddFaq
          onClose={() => {
            setShowAddDialog(false);
            fetchFaqs();
          }}
        />
      )}

      {showEditDialog && faqToEdit && (
        <EditFaq
          faq={faqToEdit}
          onClose={() => {
            setShowEditDialog(false);
            setFaqToEdit(null);
            fetchFaqs();
          }}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        message={`Supprimer "${toDeleteQuestion}" ? Cette action est irréversible.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default HelpFaqList;