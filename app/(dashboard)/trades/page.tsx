"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Eye, X, ArrowLeftRight, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchTrades, declineTrade, Trade } from "@/app/store/slices/tradesSlice";
import { useAlert } from "@/app/context/AlertContext";
import ErrorState from "@/app/components/ErrorState";
import Pagination from "@/app/components/Pagination";

export default function TradesPage() {
  const dispatch = useAppDispatch();
  const { items: trades, loading } = useAppSelector((state) => state.trades);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    dispatch(fetchTrades());
  }, [dispatch]);

  const handleDeclineTrade = (id: string) => {
    showConfirm(
      "Are you sure you want to decline this trade transaction? This action cannot be undone.",
      () => {
        dispatch(declineTrade(id));
        showAlert("Trade declined successfully.", "success");
      },
      "Decline Trade"
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredTrades = trades.filter((trade: Trade) => {
    const matchesSearch =
      trade.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.sender?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.receiver?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.senderProduct?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.receiverProduct?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "All" || trade.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredTrades.length / rowsPerPage);
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const { error } = useAppSelector((state) => state.trades);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#155DFC]" size={40} />
      </div>
    );
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchTrades())} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Trades (BidSwap)</h1>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search by trade ID, items, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-zinc-300 focus:outline-none focus:border-[#155DFC] transition-colors"
          />
        </div>

        {/* Interactive Filter Dropdown Popover */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 bg-[#111111] border px-4 py-3 rounded-xl text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer ${
              isFilterOpen || statusFilter !== "All"
                ? "border-[#155DFC] text-white"
                : "border-white/5"
            }`}
          >
            <Filter size={18} />
            <span className="font-medium">Filter</span>
            {statusFilter !== "All" && (
              <span className="w-2 h-2 rounded-full bg-[#155DFC]" />
            )}
          </button>

          {isFilterOpen && (
            <>
              {/* Overlay to close popover */}
              <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
              
              <div className="absolute right-0 mt-2 w-64 bg-[#111111]/95 border border-white/10 rounded-2xl p-5 shadow-2xl z-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Filters</span>
                  <button
                    onClick={() => {
                      setStatusFilter("All");
                    }}
                    className="text-[10px] text-[#155DFC] hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>

                {/* Status Filter Pills */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Completed", "Accepted", "Pending", "Declined"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          statusFilter.toLowerCase() === status.toLowerCase()
                            ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/20"
                            : "bg-black/40 text-zinc-400 hover:text-white border border-white/5"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500 text-sm">
                <th className="px-6 py-4 font-medium">Trade ID</th>
                <th className="px-6 py-4 font-medium">Sender</th>
                <th className="px-6 py-4 font-medium">Receiver</th>
                <th className="px-6 py-4 font-medium">Offered Items</th>
                <th className="px-6 py-4 font-medium text-center">Cash Supplement</th>
                <th className="px-6 py-4 font-medium">Verification</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-zinc-500 font-medium">
                    No trades matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedTrades.map((trade) => (
                  <tr key={trade.id} className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-zinc-500">{trade.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {trade.sender?.charAt(0) || "S"}
                        </div>
                        <span className="font-medium truncate max-w-[100px]">{trade.sender}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {trade.receiver?.charAt(0) || "R"}
                        </div>
                        <span className="font-medium truncate max-w-[100px]">{trade.receiver}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-200">{trade.senderProduct}</span>
                        <ArrowLeftRight size={12} className="text-zinc-500 shrink-0" />
                        <span className="text-zinc-200">{trade.receiverProduct}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-zinc-200">
                      {trade.supplement || "$0"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-green-500/10 text-green-500 border-green-500/20">
                        Escrow Verified
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          trade.status === "Completed" || trade.status === "Accepted"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : trade.status === "Pending"
                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}
                      >
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <button
                          onClick={() => setSelectedTrade(trade)}
                          className="p-2 bg-black/40 hover:bg-[#155DFC]/20 border border-white/5 hover:border-[#155DFC]/30 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
                          title="View Swap Info"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDeclineTrade(trade.id)}
                          className="p-2 bg-black/40 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 text-zinc-400 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                          title="Cancel/Decline Trade"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredTrades.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
            totalItems={filteredTrades.length}
            itemNamePlural="trades"
          />
        )}
      </div>

      {/* Trade details Modal */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedTrade(null)}
          />

          <div className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">BidSwap Details</h2>
                  <p className="text-zinc-500 text-sm mt-1">Direct item exchange statistics</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    selectedTrade.status === "Completed" || selectedTrade.status === "Accepted"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : selectedTrade.status === "Pending"
                      ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}
                >
                  {selectedTrade.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-black/40 border border-white/5 rounded-2xl">
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Trade ID</span>
                  <span className="text-sm font-mono text-zinc-300 block mt-1">{selectedTrade.id}</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Supplement Cash</span>
                  <span className="text-sm font-medium text-green-500 block mt-1">{selectedTrade.supplement || "$0"}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
                  <span className="text-xs text-blue-400 uppercase tracking-wider block font-bold">Sender Offer ({selectedTrade.sender})</span>
                  <span className="text-sm text-zinc-300 font-medium block">{selectedTrade.senderProduct}</span>
                </div>
                <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-2xl space-y-2">
                  <span className="text-xs text-teal-400 uppercase tracking-wider block font-bold">Receiver Demand ({selectedTrade.receiver})</span>
                  <span className="text-sm text-zinc-300 font-medium block">{selectedTrade.receiverProduct}</span>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  onClick={() => setSelectedTrade(null)}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 rounded-xl text-sm font-semibold transition-all active:scale-95"
                >
                  Close Overview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
