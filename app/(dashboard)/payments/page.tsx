"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle, Loader2, Search, Filter, Undo2, FileText, ArrowUpRight, ShieldAlert } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchPayments, type Transaction } from "@/app/store/slices/paymentsSlice";
import { useAlert } from "@/app/context/AlertContext";
import { api } from "@/app/lib/api";
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
  const { showAlert, showConfirm } = useAlert();

  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);
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
    { 
      name: "Total Revenue", 
      value: formatCurrency(summary?.totalRevenue ?? 0), 
      icon: DollarSign, 
      color: "text-emerald-400 border-emerald-500/20", 
      bgGrad: "from-emerald-500/10 to-teal-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    },
    { 
      name: "Commission Earned", 
      value: formatCurrency(summary?.commissionEarned ?? 0), 
      icon: TrendingUp, 
      color: "text-blue-400 border-blue-500/20", 
      bgGrad: "from-blue-500/10 to-indigo-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    },
    { 
      name: "Pending Payouts", 
      value: formatCurrency(summary?.pendingPayouts ?? 0), 
      icon: Clock, 
      color: "text-amber-400 border-amber-500/20", 
      bgGrad: "from-amber-500/10 to-orange-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    },
    { 
      name: "Completed Payouts", 
      value: formatCurrency(summary?.completedPayouts ?? 0), 
      icon: CheckCircle, 
      color: "text-purple-400 border-purple-500/20", 
      bgGrad: "from-purple-500/10 to-pink-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]",
    },
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

  const handleRefund = (tx: Transaction) => {
    showConfirm(
      `Are you sure you want to refund this transaction (${tx.id})? This will reverse the payment of ${typeof tx.amount === "number" ? formatCurrency(tx.amount) : tx.amount} back to the customer.`,
      async () => {
        try {
          await api.orders.refund(tx.id);
          showAlert("Transaction refund processed successfully.", "success");
          dispatch(fetchPayments());
        } catch (err: any) {
          showAlert(err?.message || "Failed to process transaction refund.", "error");
        }
      },
      "Refund Payment"
    );
  };

  const handleDownloadInvoice = async (tx: Transaction) => {
    try {
      const token = localStorage.getItem("admin_access_token");
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5007/api/v1";
      const invoiceUrl = `${baseUrl}/payment/${tx.id}/invoice`;

      // Trigger file fetch with Bearer auth
      const response = await fetch(invoiceUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMsg = "Failed to retrieve invoice";
        try {
          const errData = await response.json();
          errorMsg = errData.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      // Check if response is Stripe receipt URL
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        const finalUrl = json.data?.url || json.url;
        if (finalUrl) {
          window.open(finalUrl, "_blank");
          showAlert("Stripe receipt link opened in a new tab.", "success");
          return;
        }
      }

      // Handle PDF response
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `invoice-${tx.id.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      showAlert("Invoice PDF downloaded successfully.", "success");
    } catch (err: any) {
      showAlert(err?.message || "Failed to generate invoice receipt PDF.", "error");
    }
  };

  const { error } = useAppSelector((state) => state.payments);

  if (loading && transactions.length === 0) {
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
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Payments & Revenue
            {loading && <Loader2 className="animate-spin text-[#155DFC]" size={20} />}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Audit platform sales commissions, manage Stripe payment refunds, and track pending payout logs.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`group bg-gradient-to-br ${stat.bgGrad} border border-white/5 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:border-white/10 ${stat.glow} flex items-center justify-between`}
          >
            <div className="space-y-2">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{stat.name}</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-black/40 border ${stat.color} flex items-center justify-center`}>
              <stat.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Table Section */}
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
                      {["All", "Purchase", "Escrow Charge", "Trade", "Boost"].map((t) => (
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
                      {["All", "Completed", "Pending", "Failed", "Refunded"].map((status) => (
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

        {/* Table grid */}
        <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium text-xs">Transaction ID</th>
                  <th className="px-6 py-4 font-medium text-xs">User</th>
                  <th className="px-6 py-4 font-medium text-xs">Type</th>
                  <th className="px-6 py-4 font-medium text-xs">Amount</th>
                  <th className="px-6 py-4 font-medium text-xs">Gateway</th>
                  <th className="px-6 py-4 font-medium text-xs">Date</th>
                  <th className="px-6 py-4 font-medium text-center text-xs">Status</th>
                  <th className="px-6 py-4 font-medium text-center text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-zinc-500 font-medium">
                      No transactions found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx: Transaction) => {
                    const isRefundable = tx.status?.toLowerCase() === "completed" || tx.status?.toLowerCase() === "succeeded";
                    
                    return (
                      <tr key={tx.id} className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-zinc-500">{tx.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#155DFC]/20 border border-[#155DFC]/30 flex items-center justify-center text-white text-xs font-bold">
                              {tx.user?.charAt(0) || "U"}
                            </div>
                            <span className="font-semibold text-zinc-200">{tx.user}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
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
                        <td className="px-6 py-4 text-zinc-500 text-sm font-medium">
                          {tx.date}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              tx.status === "Completed" || tx.status === "Succeeded"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : tx.status === "Refunded"
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setSelectedInvoice(tx)}
                              className="p-2 bg-black/40 hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/30 text-zinc-400 hover:text-blue-400 rounded-xl transition-all cursor-pointer"
                              title="Audit Invoice"
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              onClick={() => isRefundable && handleRefund(tx)}
                              disabled={!isRefundable}
                              className={`p-2 rounded-xl border transition-all ${
                                isRefundable
                                  ? "bg-black/40 hover:bg-red-500/20 border-white/5 hover:border-red-500/30 text-zinc-400 hover:text-red-500 cursor-pointer"
                                  : "bg-zinc-900 border-white/[0.02] text-zinc-700 cursor-not-allowed"
                              }`}
                              title={isRefundable ? "Issue Refund" : "Not Refundable"}
                            >
                              <Undo2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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

      {/* Invoice Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedInvoice(null)}
          />

          <div className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              {/* Receipt Header */}
              <div className="text-center pb-6 border-b border-white/5 space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#155DFC]/20 border border-[#155DFC]/30 flex items-center justify-center text-[#155DFC] mx-auto mb-2">
                  <DollarSign size={24} />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">CultureCards Receipt</h2>
                <p className="text-zinc-500 text-xs font-medium">Stripe Payment Audit Reference</p>
              </div>

              {/* Invoice Specs */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Transaction ID</span>
                  <span className="font-mono text-zinc-300 font-bold">{selectedInvoice.id}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Customer User</span>
                  <span className="text-zinc-300 font-semibold">{selectedInvoice.user}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Transaction Type</span>
                  <span className="text-zinc-300 font-semibold">{selectedInvoice.type}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Gateway Processor</span>
                  <span className="text-zinc-300 font-semibold">{selectedInvoice.gateway || "Stripe"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Transaction Date</span>
                  <span className="text-zinc-300 font-semibold">{selectedInvoice.date}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Payment Status</span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                      selectedInvoice.status === "Completed" || selectedInvoice.status === "Succeeded"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : selectedInvoice.status === "Refunded"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                    }`}
                  >
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              {/* Price Calculation details */}
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Subtotal Amount</span>
                  <span className="text-zinc-300 font-semibold">
                    {formatCurrency(typeof selectedInvoice.amount === "number" ? selectedInvoice.amount * 0.95 : parseFloat(String(selectedInvoice.amount).replace(/[^0-9.]/g, "")) * 0.95)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Platform Comm. (5%)</span>
                  <span className="text-zinc-300 font-semibold">
                    {formatCurrency(typeof selectedInvoice.amount === "number" ? selectedInvoice.amount * 0.05 : parseFloat(String(selectedInvoice.amount).replace(/[^0-9.]/g, "")) * 0.05)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/5 text-lg font-bold">
                  <span className="text-white">Total Captured</span>
                  <span className="text-[#10b981]">{formatCurrency(selectedInvoice.amount)}</span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    const tempItem = selectedInvoice;
                    setSelectedInvoice(null);
                    handleDownloadInvoice(tempItem);
                  }}
                  className="flex-1 py-3 bg-[#155DFC] hover:bg-[#004ade] text-white rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer text-center"
                >
                  Download Receipt
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
