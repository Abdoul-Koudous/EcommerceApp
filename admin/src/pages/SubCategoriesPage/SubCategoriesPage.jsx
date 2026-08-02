import React, { useEffect, useState, useContext } from "react";
import { FaEdit, FaTrash, FaChevronRight, FaChevronDown } from "react-icons/fa";
import "./subCategories.scss";
import AddSubCategory from "./AddSubCategory";
import { fetchDataFromApi, deleteData, editData } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";

const SubCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [openAdd, setOpenAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({ name: "", parentId: "" });
  const { openToast } = useContext(ToastContext);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);

  const handleDeleteClick = (_id) => {
    setToDeleteId(_id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (toDeleteId) {
      deleteSubCategory(toDeleteId);
      setToDeleteId(null);
      setConfirmOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setToDeleteId(null);
    setConfirmOpen(false);
  };

  useEffect(() => {
    fetchDataFromApi("/api/category").then((res) => {
      setCategories(res?.data || []);
    });
  }, []);

  // 🔹 Retrait récursif — symétrique à updateCategory utilisée dans handleSave,
  // nécessaire car une sous-catégorie supprimée peut être nichée dans .children
  const removeCategoryById = (list, id) =>
    list
      .filter((cat) => cat._id !== id)
      .map((cat) =>
        cat.children?.length
          ? { ...cat, children: removeCategoryById(cat.children, id) }
          : cat
      );

  const deleteSubCategory = async (_id) => {
    try {
      const res = await deleteData(`/api/category/${_id}`);

      // ✅ corrigé : deleteData renvoie le JSON directement, pas res.data.success
      if (res?.success) {
        openToast("success", res.message || "Catégorie supprimée");
        setCategories((prev) => removeCategoryById(prev, _id));
      } else {
        openToast("error", res?.message || "Erreur lors de la suppression");
      }
    } catch {
      openToast("error", "Erreur serveur");
    }
  };

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditClick = (cat) => {
    setEditingId(cat._id);
    setEditingData({ name: cat.name, parentId: cat.parentId || "" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({ name: "", parentId: "" });
  };

  const handleSave = async (catId) => {
    try {
      const payload = {
        name: editingData.name,
        parentId: editingData.parentId || null,
      };

      const res = await editData(`/api/category/${catId}`, payload);

      if (res?.success) {
        openToast("success", "Modification enregistrée");

        setCategories((prevCategories) => {
          const updateCategory = (list) =>
            list.map((cat) => {
              if (cat._id === catId) {
                return { ...cat, name: payload.name, parentId: payload.parentId, parentCatName: res.category.parentCatName };
              }
              if (cat.children?.length) {
                return { ...cat, children: updateCategory(cat.children) };
              }
              return cat;
            });
          return updateCategory(prevCategories);
        });

        handleCancel();
      } else {
        openToast("error", res?.message || "Erreur serveur");
      }
    } catch (err) {
      console.error(err);
      openToast("error", "Erreur serveur");
    }
  };

  const findCategory = (list, id) => {
    for (let cat of list) {
      if (cat._id === id) return cat;
      if (cat.children?.length) {
        const found = findCategory(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // ✅ corrigé : prend le parentId COURANT du formulaire (editingData.parentId),
  // pas cat.parentId figé au moment de l'ouverture de l'édition — sinon les
  // options ne se recalculaient jamais quand l'admin changeait de sélection
  const getParentOptions = (currentParentId) => {
    if (!currentParentId) return [{ _id: "", name: "-- Pas de parent --" }];

    const parent = findCategory(categories, currentParentId);
    if (!parent) return [{ _id: "", name: "-- Pas de parent --" }];

    if (!parent.parentId) {
      return [
        { _id: "", name: "-- Pas de parent --" },
        ...categories.map((c) => ({ _id: c._id, name: c.name })),
      ];
    }

    let secteur = parent;
    while (secteur.parentId) {
      const next = findCategory(categories, secteur.parentId);
      if (!next) break;
      secteur = next;
    }

    const options = [{ _id: parent._id, name: parent.name }];
    if (secteur.children?.length) {
      secteur.children.forEach((sub) => {
        if (sub._id !== parent._id) options.push({ _id: sub._id, name: sub.name });
      });
    }

    return options;
  };

  const renderRows = (list, level = 0) =>
    list.map((cat) => {
      const hasChildren = cat.children?.length > 0;
      const isOpen = expanded[cat._id];

      return (
        <React.Fragment key={cat._id}>
          <div className={`sct-row ${level === 0 ? "sct-level-0" : ""}`}>
            {editingId === cat._id ? (
              <>
                <select
                  value={editingData.parentId}
                  onChange={(e) =>
                    setEditingData((prev) => ({ ...prev, parentId: e.target.value }))
                  }
                >
                  {/* ✅ corrigé : getParentOptions(cat) → getParentOptions(editingData.parentId) */}
                  {getParentOptions(editingData.parentId).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={editingData.name}
                  onChange={(e) =>
                    setEditingData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />

                <button className="sct-edit-btn sct-save" onClick={() => handleSave(cat._id)}>
                  Sauvegarder
                </button>
                <button className="sct-edit-btn sct-cancel" onClick={handleCancel}>
                  Annulé
                </button>
              </>
            ) : (
              <>
                <div className="sct-cell sct-name">
                  <span className="sct-indent" style={{ marginLeft: level * 20 }} />
                  {hasChildren && (
                    <span className="sct-toggle" onClick={() => toggle(cat._id)}>
                      {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                    </span>
                  )}
                  {cat.name}
                </div>

                <div className="sct-cell sct-actions-cell">
                  <FaEdit className="sct-icon sct-icon-edit" onClick={() => handleEditClick(cat)} />
                  <FaTrash
                    className="sct-icon sct-icon-delete"
                    onClick={() => handleDeleteClick(cat._id)}
                  />
                </div>
              </>
            )}
          </div>

          {hasChildren && isOpen && renderRows(cat.children, level + 1)}
        </React.Fragment>
      );
    });

  return (
    <div className="sct-page">
      <div className="sct-header">
        <h2>Catégories & Sous-catégories</h2>
        <div className="sct-actions">
          <button className="sct-btn sct-btn-export">Exporter</button>
          <button className="sct-btn sct-btn-add" onClick={() => setOpenAdd(true)}>
            Ajouter
          </button>
        </div>
      </div>

      <div className="sct-tree-table">{renderRows(categories)}</div>

      {openAdd && (
        <AddSubCategory
          onClose={() => setOpenAdd(false)}
          onAddCategory={(newCategory) =>
            setCategories((prev) => [...prev, newCategory])
          }
        />
      )}
      <ConfirmDialog
        open={confirmOpen}
        message="Voulez-vous vraiment supprimer cette catégorie ?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

    </div>
  );
};

export default SubCategoriesPage;