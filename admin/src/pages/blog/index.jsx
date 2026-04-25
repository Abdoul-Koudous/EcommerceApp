import React, { useState, useEffect, useContext } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./blogList.scss";

import { deleteData, fetchDataFromApi } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";

import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import PaginationPro from "../../components/paginnationpro/paginationpro";
import CircularProgress from "../../components/CircularProgress/CircularProgress";

import AddBlog from "./AddBlog";
import EditBlog from "./EditBlog ";


const BlogList = () => {
  const { openToast } = useContext(ToastContext);

  const [blogs, setBlogs] = useState([]);
  const [selected, setSelected] = useState([]);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);

  const [loading, setLoading] = useState(true);

  // 🔥 PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  // 🔥 LOAD BLOGS (FIX ICI)
 const loadBlogs = async () => {
  setLoading(true);
  try {
    const res = await fetchDataFromApi(
      `/api/blog?page=${currentPage}&perPage=${itemsPerPage}`
    );

    // ✅ IMPORTANT
    setBlogs(res?.data || []);
    setTotalItems(res?.total || 0);

  } catch (err) {
    openToast("error", "Erreur chargement blogs");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadBlogs();
  }, [currentPage, itemsPerPage]);

  // 🔥 DELETE
  const handleDeleteClick = (id) => {
    setToDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (toDeleteId) {
        const res = await deleteData(`/api/blog/${toDeleteId}`);

        if (res?.success) {
          setBlogs((prev) => prev.filter((b) => b._id !== toDeleteId));
          openToast("success", "Blog supprimé");
        }
      } else if (selected.length > 0) {
        for (let id of selected) {
          await deleteData(`/api/blog/${id}`);
        }

        setBlogs((prev) =>
          prev.filter((b) => !selected.includes(b._id))
        );

        setSelected([]);
        openToast("success", "Blogs supprimés");
      }
    } catch {
      openToast("error", "Erreur suppression");
    }

    setConfirmOpen(false);
    setToDeleteId(null);
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setToDeleteId(null);
  };

  // 🔥 SELECT
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(blogs.map((b) => b._id));
    } else {
      setSelected([]);
    }
  };

  // 🔥 EDIT
  const handleEdit = (blog) => {
    setCurrentBlog(blog);
    setOpenEdit(true);
  };
  const stripHtml = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };
  return (
    <div className="blog-list-page">

      {/* HEADER */}
      <div className="header">
        <h2>Liste des blogs</h2>

        <div className="actions">

          {/* 🔥 DELETE MULTIPLE */}
          {selected.length > 0 && (
            <button
              className="btn delete-multiple"
              onClick={() => setConfirmOpen(true)}
            >
              <FaTrash /> Supprimer ({selected.length})
            </button>
          )}

          <button className="btn add" onClick={() => setOpenAdd(true)}>
            Ajouter
          </button>
        </div>
      </div>

      {/* BODY */}
      {loading ? (
        <CircularProgress />
      ) : (
        <div className="table-container">

          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      blogs.length > 0 &&
                      selected.length === blogs.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Image</th>
                <th>Titre</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {blogs.map((blog) => (
                <tr key={blog._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(blog._id)}
                      onChange={() => toggleSelect(blog._id)}
                    />
                  </td>

                  <td>
                    <div className="blog-image">
                      <img src={blog.images?.[0]} alt="" />
                    </div>
                  </td>

                  <td>{blog.title}</td>

                  <td>
                    <div className="blog-desc">
                      {stripHtml(blog.description).substring(0, 100)}...
                    </div>
                  </td>

                  <td>
                    <FaEdit
                      className="icon edit"
                      onClick={() => handleEdit(blog)}
                    />

                    <FaTrash
                      className="icon delete"
                      onClick={() =>
                        handleDeleteClick(blog._id)
                      }
                    />
                  </td>
                </tr>
              ))}

              {blogs.length === 0 && (
                <tr>
                  <td colSpan={5}>Aucun blog trouvé</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* FOOTER */}
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
        <AddBlog
          onClose={() => setOpenAdd(false)}
          onAddBlog={(newBlog) =>
            setBlogs((prev) => [newBlog, ...prev])
          }
        />
      )}

      {/* EDIT */}
      {openEdit && currentBlog && (
        <EditBlog
          blog={currentBlog}
          onClose={() => {
            setOpenEdit(false);
            setCurrentBlog(null);
          }}
          onUpdateBlog={() => loadBlogs()}
        />
      )}

      {/* CONFIRM */}
      <ConfirmDialog
        open={confirmOpen}
        message={
          toDeleteId
            ? "Supprimer ce blog ?"
            : `Supprimer ${selected.length} blog(s) ?`
        }
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

    </div>
  );
};

export default BlogList;