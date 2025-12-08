import React from "react";
import {
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";
import "./paginationpro.scss";

const PaginationPro = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageRange = 2;
  const startPage = Math.max(1, currentPage - pageRange);
  const endPage = Math.min(totalPages, currentPage + pageRange);
  const visiblePages = [];

  for (let i = startPage; i <= endPage; i++) visiblePages.push(i);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    onPageChange(pageNumber);
  };

  return (
    <div className="pagination-pro">
      <button onClick={() => paginate(1)} disabled={currentPage === 1}>
        <FaAngleDoubleLeft />
      </button>
      <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
        <FaAngleLeft />
      </button>

      {startPage > 1 && <span className="dots">...</span>}

      {visiblePages.map((num) => (
        <button
          key={num}
          onClick={() => paginate(num)}
          className={currentPage === num ? "active" : ""}
        >
          {num}
        </button>
      ))}

      {endPage < totalPages && <span className="dots">...</span>}

      <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
        <FaAngleRight />
      </button>
      <button onClick={() => paginate(totalPages)} disabled={currentPage === totalPages}>
        <FaAngleDoubleRight />
      </button>
    </div>
  );
};

export default PaginationPro;
