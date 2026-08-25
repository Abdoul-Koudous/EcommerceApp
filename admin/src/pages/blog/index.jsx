import React, { useEffect, useState, useContext, useCallback } from "react";
import { FaEdit, FaTrash, FaPlus, FaStar, FaRegStar, FaSearch } from "react-icons/fa";
import "./blogadmin.scss";
import PaginationPro from "../../components/paginnationpro/paginationpro";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import CircularProgress from "../../components/CircularProgress/CircularProgress";
import AddBlog from "./AddBlog";
import EditBlog from "./EditBlog";
import { fetchDataFromApi, deleteData, editData } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";

const BlogList = () => {
  const { openToast } = useContext(ToastContext);

  const [blogsData, setBlogsData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState(["Tous"]);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [blogToEdit, setBlogToEdit] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);
  const [toDeleteTitle, setToDeleteTitle] = useState("");

  useEffect(() => {
    fetchDataFromApi("/api/blog/getCategories").then((res) => {
      if (!res?.error) setCategories(["Tous", ...(res.categories || [])]);
    });
  }, []);

  // ✅ route admin (getAll/admin) pour voir aussi les brouillons, contrairement
  // à /api/blog/getAll qui ne renvoie que les articles publiés côté public
  const fetchBlogs = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    params.set("page", currentPage);
    params.set("perPage", itemsPerPage);
    if (activeCategory !== "Tous") params.set("category", activeCategory);
    if (searchTerm.trim()) params.set("search", searchTerm.trim());

    const res = await fetchDataFromApi(`/api/blog/admin/getAll?${params.toString()}`);

    if (!res?.error) {
      setBlogsData(res.data || []);
      setTotalItems(res.total || 0);
    } else {
      openToast("error", "Échec du chargement des articles");
      setBlogsData([]);
      setTotalItems(0);
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, activeCategory, searchTerm]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleDeleteClick = (id, title) => {
    setToDeleteId(id);
    setToDeleteTitle(title);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await deleteData(`/api/blog/delete/${toDeleteId}`);

      if (!res?.error) {
        openToast("success", "Article supprimé");

        if (blogsData.length === 1 && currentPage > 1) {
          setCurrentPage((p) => p - 1);
        } else {
          fetchBlogs();
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

  const toggleFeatured = async (blog) => {
    const res = await editData(`/api/blog/update/${blog._id}`, {
      featured: !blog.featured,
    });

    if (!res?.error) {
      openToast("success", blog.featured ? "Retiré de la une" : "Mis en avant");
      fetchBlogs();
    } else {
      openToast("error", res.message || "Échec de la mise à jour");
    }
  };

  const toggleStatus = async (blog) => {
    const newStatus = blog.status === "published" ? "draft" : "published";
    const res = await editData(`/api/blog/update/${blog._id}`, { status: newStatus });

    if (!res?.error) {
      openToast(
        "success",
        newStatus === "published" ? "Article publié" : "Repassé en brouillon"
      );
      fetchBlogs();
    } else {
      openToast("error", res.message || "Échec de la mise à jour");
    }
  };

  return (
    <div className="bladm-page">
      <div className="bladm-header">
        <h2>Articles du blog</h2>

        <button className="bladm-add-btn" onClick={() => setShowAddDialog(true)}>
          <FaPlus /> Nouvel article
        </button>
      </div>

      <div className="bladm-toolbar">
        <div className="bladm-search-bar">
          <FaSearch className="icon" />
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="bladm-categories">
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
        <div className="bladm-loading">
          <CircularProgress />
        </div>
      ) : blogsData.length === 0 ? (
        <div className="bladm-empty">Aucun article trouvé.</div>
      ) : (
        <div className="bladm-table-wrapper">
          <table className="bladm-table">
            <thead>
              <tr>
                <th>Couverture</th>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Lecture</th>
                <th>Vedette</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {blogsData.map((blog) => (
                <tr key={blog._id}>
                  <td>
                    {blog.image ? (
                      <img src={blog.image} alt="" className="bladm-thumb" />
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>{blog.title}</td>
                  <td>{blog.category}</td>

                  <td>
                    <button
                      type="button"
                      className={`bladm-status-badge ${blog.status}`}
                      onClick={() => toggleStatus(blog)}
                      title="Cliquer pour changer le statut"
                    >
                      {blog.status === "published" ? "Publié" : "Brouillon"}
                    </button>
                  </td>

                  <td>
                    {blog.date ? new Date(blog.date).toLocaleDateString("fr-FR") : "—"}
                  </td>

                  <td>{blog.readTime ? `${blog.readTime} min` : "—"}</td>

                  <td>
                    <button
                      type="button"
                      className="bladm-star"
                      onClick={() => toggleFeatured(blog)}
                      title={blog.featured ? "Retirer de la une" : "Mettre en avant"}
                    >
                      {blog.featured ? <FaStar /> : <FaRegStar />}
                    </button>
                  </td>

                  <td className="bladm-actions">
                    <button
                      className="bladm-edit-btn"
                      onClick={() => {
                        setBlogToEdit(blog);
                        setShowEditDialog(true);
                      }}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="bladm-delete-btn"
                      onClick={() => handleDeleteClick(blog._id, blog.title)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bladm-table-footer">
        <div className="bladm-items-selector">
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
        <AddBlog
          onClose={() => {
            setShowAddDialog(false);
            fetchBlogs();
          }}
        />
      )}

      {showEditDialog && blogToEdit && (
        <EditBlog
          blog={blogToEdit}
          onClose={() => {
            setShowEditDialog(false);
            setBlogToEdit(null);
            fetchBlogs();
          }}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        message={`Supprimer "${toDeleteTitle}" ? Cette action est irréversible.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default BlogList;