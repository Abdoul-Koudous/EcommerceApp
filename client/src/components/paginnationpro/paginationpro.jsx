import React from "react";
import {
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight
} from "react-icons/fa";
import "./paginationpro.scss";

const PaginationPro = ({ page, totalPages, setPage }) => {
  if (totalPages <= 1) return null;

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) {
      setPage(p);
    }
  };

  return (
    <div className="pagination">
      
      {/* First */}
      <button onClick={() => goToPage(1)} disabled={page === 1}>
        <FaAngleDoubleLeft />
      </button>

      {/* Prev */}
      <button onClick={() => goToPage(page - 1)} disabled={page === 1}>
        <FaAngleLeft />
      </button>

      {/* Pages dynamiques */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
        if (
          num === 1 ||
          num === totalPages ||
          (num >= page - 1 && num <= page + 1)
        ) {
          return (
            <button
              key={num}
              className={page === num ? "active" : ""}
              onClick={() => goToPage(num)}
            >
              {num}
            </button>
          );
        }

        return null;
      })}

      {/* Next */}
      <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}>
        <FaAngleRight />
      </button>

      {/* Last */}
      <button onClick={() => goToPage(totalPages)} disabled={page === totalPages}>
        <FaAngleDoubleRight />
      </button>
    </div>
  );
};

export default PaginationPro;