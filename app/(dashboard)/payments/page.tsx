"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle, Loader2, Search, Filter } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchPayments, type Transaction } from "@/app/store/slices/paymentsSlice";
import ErrorState from "@/app/components/ErrorState";
import Pagination from "@/app/components/Pagination";

const formatCurrency = (val: string | number) => {
  if (typeof val === "string") {
    if (val.startsWith("$")) return val;
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return val;
    val = parsed;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);
};

export default function PaymentsPage() {
  const dispatch = useAppDispatch();
  const { items: transactions, summary, loading } = useAppSelector((state) => state.payments);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchPayments());
  }, [dispatch]);

  const stats = [
    { name: "Total Revenue", value: formatCurrency(summary?.totalRevenue ?? 0), icon: DollarSign, color: "bg-green-500" },
    { name: "Commission Earned", value: formatCurrency(summary?.commissionEarned ?? 0), icon: TrendingUp, color: "bg-blue-500" },
    { name: "Pending Payouts", value: formatCurrency(summary?.pendingPayouts ?? 0), icon: Clock, color: "bg-yellow-500" },
    { name: "Completed Payouts", value: formatCurrency(summary?.completedPayouts ?? 0), icon: CheckCircle, color: "bg-purple-500" },
  ];

  // Filtering transactions
  const filteredTransactions = transactions.filter((tx: Transaction) => {
    const matchesSearch =
      tx.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.gateway?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === "All" || tx.type?.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "All" || tx.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const { error } = useAppSelector((state) => state.payments);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#155DFC]" size={40} />
      </div>
    );
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchPayments())} />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Payments & Revenue</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-[#111111] border border-white/5 p-6 rounded-2xl space-y-4">
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-zinc-500 text-sm font-medium">{stat.name}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="space-y-4">
        
        {/* Search & Custom Filter Bar */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="Search transactions by ID, user, or gateway..."
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
                isFilterOpen || typeFilter !== "All" || statusFilter !== "All"
                  ? "border-[#155DFC] text-white"
                  : "border-white/5"
              }`}
            >
              <Filter size={18} />
              <span className="font-medium">Filter</span>
              {(typeFilter !== "All" || statusFilter !== "All") && (
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
                        setTypeFilter("All");
                        setStatusFilter("All");
                      }}
                      className="text-[10px] text-[#155DFC] hover:underline font-bold"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Transaction Type Pills */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Type</label>
                    <div className="flex flex-wrap gap-1.5">
                      {["All", "Purchase", "Escrow Charge", "Trade"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTypeFilter(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            typeFilter === t
                              ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/20"
                              : "bg-black/40 text-zinc-400 hover:text-white border border-white/5"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status Pills */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Status</label>
                    <div className="flex flex-wrap gap-1.5">
                      {["All", "Completed", "Pending"].map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            statusFilter === status
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

        <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Transaction ID</th>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Gateway</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-medium">
                      No transactions found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx: Transaction) => (
                    <tr key={tx.id} className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-zinc-500">{tx.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            {tx.user?.charAt(0) || "U"}
                          </div>
                          <span className="font-medium">{tx.user}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span 
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            tx.type === 'Purchase' || tx.type === 'Escrow Charge'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                              : tx.type === 'Trade'
                              ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#10b981] text-lg">
                        {typeof tx.amount === "number" ? formatCurrency(tx.amount) : tx.amount}
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-medium">
                        {tx.gateway || "Stripe"}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-sm">
                        {tx.date}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            tx.status === "Completed"
                              ? "bg-green-500/10 text-green-500 border-green-500/20"
                              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredTransactions.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={setRowsPerPage}
              totalItems={filteredTransactions.length}
              itemNamePlural="transactions"
            />
          )}
        </div>
      </div>
    </div>
  );
}
