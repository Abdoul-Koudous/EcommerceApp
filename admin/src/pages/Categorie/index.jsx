import React, { useState, useEffect,useContext } from "react";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import "./categories.scss";
import AddCategory from "./AddCategory";
import EditCategory from "./EditCategory";
import { deleteData, fetchDataFromApi } from "../utils/api";
import { ToastContext } from "../../context/ToastContext";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";

const CategoriesPage = () => {
  const [catData, setCatData] = useState([]);
  const [selected, setSelected] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const { openToast } = useContext(ToastContext);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
const [toDeleteId, setToDeleteId] = useState(null);





const handleCancelDelete = () => {
  setToDeleteId(null);
  setConfirmOpen(false);
};


  useEffect(() => {
    fetchDataFromApi("/api/category").then((res) => {
      setCatData(res?.data);
    });
  }, []);

  // Quand on clique sur la poubelle
const handleDeleteClick = (_id) => {
  setToDeleteId(_id);
  setConfirmOpen(true);
};

// Suppression réelle
const handleConfirmDelete = async () => {
  if (!toDeleteId) return;

  try {
    const res = await deleteData(`/api/category/${toDeleteId}`);
    if (res?.data?.success) {
      setCatData(prev => prev.filter(cat => cat._id !== toDeleteId));
      openToast("success", res?.data?.message || "Catégorie supprimée avec succès");
    } else {
      openToast("error", res?.data?.message || "Erreur suppression catégorie");
    }
  } catch {
    openToast("error", "Erreur suppression catégorie");
  }

  setToDeleteId(null);
  setConfirmOpen(false);
};



  const toggleSelect = (_id) => {
    setSelected(selected.includes(_id) ? [] : [_id]);
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(catData.map((c) => c._id));
    } else {
      setSelected([]);
    }
  };

  const handleEdit = (cat) => {
    setCurrentCategory(cat);
    setOpenEdit(true);
  };

  return (
    <div className="categories-page">
      <div className="header">
        <h2>Liste des catégories</h2>
        <div className="actions">
          <button className="btn export">Exporter</button>
          <button className="btn add" onClick={() => setOpenAdd(true)}>
            Ajouter
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={catData.length > 0 && selected.length === catData.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Image</th>
              <th>Nom</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {catData.map((cat) => (
              <tr key={cat._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(cat._id)}
                    onChange={() => toggleSelect(cat._id)}
                  />
                </td>
                <td>
                  <img src={cat.images?.[0]} alt={cat.name} width={50} />
                </td>
                <td>{cat.name}</td>
                <td>
                  <FaEdit className="icon edit" onClick={() => handleEdit(cat)} />
                    <FaTrash
                    className="icon delete"
                    onClick={() => handleDeleteClick(cat?._id)}
                  />

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openAdd && (
        <AddCategory
          onClose={() => setOpenAdd(false)}
          onAddCategory={(newCat) => setCatData(prev => [...prev, newCat])}
        />
      )}


      {openEdit && currentCategory && (
        <EditCategory
          category={currentCategory}
          onClose={() => {
            setOpenEdit(false);
            setCurrentCategory(null);
          }}
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

export default CategoriesPage;
