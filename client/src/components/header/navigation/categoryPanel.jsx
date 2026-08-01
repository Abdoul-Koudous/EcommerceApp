import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { Link } from "react-router-dom"; // ✅ Ajout de Link
import { fetchDataFromApi } from "../../../pages/utils/api";

const CategoryPanel = ({ isOpen, onClose }) => {
  const [openMenus, setOpenMenus] = useState({});
  const [catData, setCatData] = useState([]);

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    fetchDataFromApi("/api/category")
      .then((res) => {
        if (res.error === false) {
          setCatData(res?.data);
        }
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <>
      {/* Overlay */}
      <div
        className={`drawer-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className={`drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h3>Catégories</h3>
          <button className="close-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <ul className="drawer-list">
          {catData?.length !== 0 &&
            catData.map((cat, i) => (
              <li key={i}>
                <div className="category-title">
                  {/* ✅ Lien vers la catégorie */}
                  <Link
                    to={`/productlisting?catId=${cat?._id}`}
                    className="category-name"
                    onClick={onClose}
                  >
                    {cat?.name}
                  </Link>

                  {/* Bouton + / - */}
                  {cat?.children && cat.children.length > 0 && (
                    <span
                      className="toggle-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(i);
                      }}
                    >
                      {openMenus[i] ? <FaMinus /> : <FaPlus />}
                    </span>
                  )}
                </div>

                {/* Sous-catégories */}
                {openMenus[i] && cat?.children?.length !== 0 && (
                  <ul className="sub-list">
                    {cat.children.map((sub, j) => (
                      <li key={j}>
                        <div className="subcategory-title">
                          {/* ✅ Lien vers la sous-catégorie */}
                          <Link
                            to={`/productlisting?subCatId=${sub?._id}`}
                            className="subcategory-name"
                            onClick={onClose}
                          >
                            {sub?.name}
                          </Link>

                          {sub?.children && sub.children.length > 0 && (
                            <span
                              className="toggle-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMenu(`${i}-${j}`);
                              }}
                            >
                              {openMenus[`${i}-${j}`] ? (
                                <FaMinus />
                              ) : (
                                <FaPlus />
                              )}
                            </span>
                          )}
                        </div>

                        {/* Sous-sous-catégories */}
                        {openMenus[`${i}-${j}`] &&
                          sub.children?.length !== 0 && (
                            <ul className="sub-sub-list">
                              {sub.children.map((item, k) => (
                                <li key={k}>
                                  {/* ✅ Lien final vers l’élément */}
                                  <Link
                                    to={`/productlisting?thirdsubCatId=${item?._id}`}
                                    onClick={onClose}
                                  >
                                    {item?.name || item}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
        </ul>
      </div>
    </>
  );
};

export default CategoryPanel;
