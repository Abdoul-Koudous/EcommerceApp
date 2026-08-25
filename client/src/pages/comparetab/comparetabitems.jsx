import React, { useContext, useState } from "react";
import { FaTrash, FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";

import "./comparetab.scss";
import { ToastContext } from "../../context/ToastContext";
import { deleteData } from "../utils/api";

const CompareTabItems = ({ items = [], onRemoved }) => {
  const { openToast } = useContext(ToastContext);
  const [removingId, setRemovingId] = useState(null);

  const handleRemove = async (productId) => {
    if (removingId) return;

    setRemovingId(productId);

    try {
      const res = await deleteData(`/api/compare/remove/${productId}`);

      if (res?.success) {
        openToast?.("success", res?.message || "Retiré du comparateur");
        onRemoved?.();
      } else {
        openToast?.("error", res?.message || "Erreur suppression");
      }
    } catch (err) {
      openToast?.("error", "Erreur serveur");
    } finally {
      setRemovingId(null);
    }
  };

  const rows = [
    { label: "Prix", render: (item) => `${item.price.toLocaleString()} FCFA` },
    { label: "Ancien prix", render: (item) => (item.oldPrice ? `${item.oldPrice.toLocaleString()} FCFA` : "-") },
    { label: "Remise", render: (item) => (item.discount ? `-${item.discount}%` : "-") },
    { label: "Marque", render: (item) => item.brand || "-" },
    {
      label: "Note",
      render: (item) => (
        <span className="compare-tab__rating">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} className={i < item.rating ? "star active" : "star"} />
          ))}
        </span>
      ),
    },
  ];

  return (
    <div className="compare-tab__table-wrap">
      <table className="compare-tab__table">
        <thead>
          <tr>
            <th></th>
            {items.map((item) => (
              <th key={item._id}>
                <div className="compare-tab__product-head">
                  <FaTrash
                    className={`compare-tab__remove ${removingId === item.productId ? "disabled" : ""}`}
                    onClick={() => handleRemove(item.productId)}
                  />
                  <img src={item.image || "/placeholder.png"} alt={item.productTitle} />
                  <Link to={`/product/${item.productId}`}>{item.productTitle}</Link>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="compare-tab__row-label">{row.label}</td>
              {items.map((item) => (
                <td key={item._id}>{row.render(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompareTabItems;