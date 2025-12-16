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

  const deleteSubCategory = async (_id) => {
    try {
      const res = await deleteData(`/api/category/${_id}`);
      if (res?.data?.success) {
        openToast("success", "Catégorie supprimée");
        setCategories((prev) => prev.filter((c) => c._id !== _id));
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
    // Préparer la payload pour le backend
    const payload = {
      name: editingData.name,
      parentId: editingData.parentId || null, // null si pas de parent
    };

    // Appel API pour mettre à jour la catégorie
    const res = await editData(`/api/category/${catId}`, payload);

    if (res?.success) {
      openToast("success", "Modification enregistrée");

      // Mettre à jour localement sans re-fetch complet
      setCategories((prevCategories) => {
        // Fonction récursive pour mettre à jour la catégorie
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



  // 🔹 Fonction récursive pour trouver une catégorie par id
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

  // 🔹 Récupérer les parents possibles selon le niveau exact
  const getParentOptions = (cat) => {
    if (!cat.parentId) return [{ _id: "", name: "-- Pas de parent --" }];

    const parent = findCategory(categories, cat.parentId);
    if (!parent) return [{ _id: "", name: "-- Pas de parent --" }];

    // Si le parent est directement sous une catégorie principale
    if (!parent.parentId) {
      // Sous-catégorie directe → options = toutes les catégories principales
      return [
        { _id: "", name: "-- Pas de parent --" },
        ...categories.map((c) => ({ _id: c._id, name: c.name })),
      ];
    }

    // Sous-sous-catégorie → options = parent direct + toutes les sous-catégories du secteur
    let secteur = parent;
    while (secteur.parentId) {
      const next = findCategory(categories, secteur.parentId);
      if (!next) break;
      secteur = next;
    }

    const options = [{ _id: parent._id, name: parent.name }]; // parent direct
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
          <div className={`row level-${level}`}>
            {editingId === cat._id ? (
              <>
                <select
                  value={editingData.parentId}
                  onChange={(e) =>
                    setEditingData((prev) => ({ ...prev, parentId: e.target.value }))
                  }
                >
                  {getParentOptions(cat).map((c) => (
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

                <button className="btn save" onClick={() => handleSave(cat._id)}>
                  Save
                </button>
                <button className="btn cancel" onClick={handleCancel}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="cell name">
                  <span className="indent" style={{ marginLeft: level * 20 }} />
                  {hasChildren && (
                    <span className="toggle" onClick={() => toggle(cat._id)}>
                      {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                    </span>
                  )}
                  {cat.name}
                </div>

                <div className="cell actions">
                  <FaEdit className="icon edit" onClick={() => handleEditClick(cat)} />
                 <FaTrash
                  className="icon delete"
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
    <div className="subcategories-page">
      <div className="header">
        <h2>Catégories & Sous-catégories</h2>
        <div className="actions">
          <button className="btn export">Exporter</button>
          <button className="btn add" onClick={() => setOpenAdd(true)}>
            Ajouter
          </button>
        </div>
      </div>

      <div className="tree-table">{renderRows(categories)}</div>

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
        message="Vouler vous vraiment supprimer cette catégorie ?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

    </div>
  );


};

export default SubCategoriesPage;
