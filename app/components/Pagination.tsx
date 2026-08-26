"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (rows: number) => void;
  totalItems: number;
  itemNamePlural?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  totalItems,
  itemNamePlural = "entries",
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show page 1
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around the current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-white/5 bg-black/40">
      {/* Items count summary */}
      <div className="text-sm text-zinc-500">
        Showing <span className="font-semibold text-zinc-300">{startItem}</span> to{" "}
        <span className="font-semibold text-zinc-300">{endItem}</span> of{" "}
        <span className="font-semibold text-zinc-300">{totalItems}</span> {itemNamePlural}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-6">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              onRowsPerPageChange(Number(e.target.value));
              onPageChange(1); // Reset to page 1 on page size change
            }}
            className="bg-[#111111] border border-white/10 rounded-xl px-2 py-1.5 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-[#155DFC] cursor-pointer transition-colors"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Page navigation buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 bg-[#111111] hover:bg-white/5 border border-white/5 rounded-xl text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 cursor-pointer disabled:cursor-not-allowed transition-all duration-200"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <span key={index} className="px-2 text-zinc-600 text-sm select-none">
                  ...
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <button
                key={index}
                onClick={() => onPageChange(Number(page))}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isCurrent
                    ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/20"
                    : "bg-[#111111] hover:bg-white/5 border border-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 bg-[#111111] hover:bg-white/5 border border-white/5 rounded-xl text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 cursor-pointer disabled:cursor-not-allowed transition-all duration-200"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
