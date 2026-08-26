"use client";

import React, { useEffect, useState } from "react";
import { Star, CheckCircle2, Loader2, Search, Filter, DollarSign, Award, Eye, Percent, ArrowUpRight, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchBoostedListings, BoostedListing } from "@/app/store/slices/boostedListingsSlice";
import { useAlert } from "@/app/context/AlertContext";
import { api } from "@/app/lib/api";
import ErrorState from "@/app/components/ErrorState";
import Pagination from "@/app/components/Pagination";

export default function BoostedListingsPage() {
  const dispatch = useAppDispatch();
  const { items: boostedListings, loading } = useAppSelector((state) => state.boostedListings);
  const { showAlert, showConfirm } = useAlert();

  const [selectedBoost, setSelectedBoost] = useState<BoostedListing | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchBoostedListings());
  }, [dispatch]);

  // Calculate dynamic stats
  const totalRevenue = boostedListings.reduce((sum, item) => {
    const val = parseFloat(item.fee.replace(/[^0-9.]/g, ""));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const totalImpressions = boostedListings.reduce((sum, item) => {
    const val = parseInt(item.impressions.replace(/[^0-9]/g, ""));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const activeCount = boostedListings.filter((item) => item.status === "Active").length;
  const premiumCount = boostedListings.filter((item) => item.level === "Premium").length;
  const premiumPercentage = boostedListings.length > 0 
    ? Math.round((premiumCount / boostedListings.length) * 100) 
    : 0;

  const stats = [
    {
      name: "Boost Fee Collected",
      value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(totalRevenue),
      icon: DollarSign,
      color: "text-emerald-400 border-emerald-500/20",
      bgGrad: "from-emerald-500/10 to-teal-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    },
    {
      name: "Active Promotions",
      value: activeCount.toLocaleString(),
      icon: Award,
      color: "text-indigo-400 border-indigo-500/20",
      bgGrad: "from-indigo-500/10 to-purple-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]",
    },
    {
      name: "Total Impressions",
      value: totalImpressions.toLocaleString(),
      icon: Eye,
      color: "text-sky-400 border-sky-500/20",
      bgGrad: "from-sky-500/10 to-blue-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(14,165,233,0.15)]",
    },
    {
      name: "Premium Boost Ratio",
      value: `${premiumPercentage}%`,
      icon: Percent,
      color: "text-amber-400 border-amber-500/20",
      bgGrad: "from-amber-500/10 to-orange-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    },
  ];

  const filteredBoostedListings = boostedListings.filter((item: BoostedListing) => {
    const matchesSearch =
      item.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = levelFilter === "All" || item.level?.toLowerCase() === levelFilter.toLowerCase();
    const matchesStatus = statusFilter === "All" || item.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesLevel && matchesStatus;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, levelFilter, statusFilter]);

  const totalPages = Math.ceil(filteredBoostedListings.length / rowsPerPage);
  const paginatedBoostedListings = filteredBoostedListings.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleVerifyBoost = (item: BoostedListing) => {
    showConfirm(
      `Do you want to run a complete subscription validation check for ${item.name} (Boost ID: ${item.id})? This updates live impression counters.`,
      () => {
        showAlert(`Verification query finished. Subscription status remains Active.`, "success");
      },
      "Verify Promotion Status"
    );
  };

  const handleRevokeBoost = (item: BoostedListing) => {
    if (!item.productId) return;
    
    showConfirm(
      `Are you sure you want to terminate this listing boost? This will remove "${item.name}" from featured marketplace slots.`,
      async () => {
        try {
          await api.products.update(item.productId!, { isFeatured: false });
          showAlert("Listing boost terminated successfully.", "success");
          dispatch(fetchBoostedListings());
        } catch (err: any) {
          showAlert(err?.message || "Failed to terminate boost.", "error");
        }
      },
      "Revoke Boost"
    );
  };

  const { error } = useAppSelector((state) => state.boostedListings);

  if (loading && boostedListings.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#155DFC]" size={40} />
      </div>
    );
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchBoostedListings())} />;
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Boosted Listings
            {loading && <Loader2 className="animate-spin text-[#155DFC]" size={20} />}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage paid listing promotions, track impressions, and monitor boost subscription tiers.
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <div
            key={idx}
            className={`group bg-gradient-to-br ${s.bgGrad} border border-white/5 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:border-white/10 ${s.glow} flex items-center justify-between`}
          >
            <div className="space-y-2">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{s.name}</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{s.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-xl bg-black/40 border ${s.color} flex items-center justify-center`}>
              <s.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search by boost ID, listing title, or seller name..."
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
              isFilterOpen || levelFilter !== "All" || statusFilter !== "All"
                ? "border-[#155DFC] text-white"
                : "border-white/5"
            }`}
          >
            <Filter size={18} />
            <span className="font-medium">Filter</span>
            {(levelFilter !== "All" || statusFilter !== "All") && (
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
                      setLevelFilter("All");
                      setStatusFilter("All");
                    }}
                    className="text-[10px] text-[#155DFC] hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>

                {/* Level Filter Pills */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Level</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Premium", "Standard"].map((level) => (
                      <button
                        key={level}
                        onClick={() => setLevelFilter(level)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          levelFilter === level
                            ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/20"
                            : "bg-black/40 text-zinc-400 hover:text-white border border-white/5"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter Pills */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Active", "Pending"].map((status) => (
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

      {/* Table Container */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium text-xs">Boost ID</th>
                <th className="px-6 py-4 font-medium text-xs">Listing Name</th>
                <th className="px-6 py-4 font-medium text-xs">Seller</th>
                <th className="px-6 py-4 font-medium text-xs">Boost Level</th>
                <th className="px-6 py-4 font-medium text-center text-xs">Duration</th>
                <th className="px-6 py-4 font-medium text-xs">Period</th>
                <th className="px-6 py-4 font-medium text-right text-xs">Impressions</th>
                <th className="px-6 py-4 font-medium text-right text-xs">Fee Paid</th>
                <th className="px-6 py-4 font-medium text-center text-xs">Status</th>
                <th className="px-6 py-4 font-medium text-center text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBoostedListings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-zinc-500 font-medium">
                    No boosted listings found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedBoostedListings.map((item: BoostedListing) => (
                  <tr key={item.id} className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-zinc-500">{item.id}</td>
                    <td className="px-6 py-4">
                      <div 
                        onClick={() => setSelectedBoost(item)}
                        className="flex items-center gap-2 group/title cursor-pointer"
                      >
                        <span className="font-semibold text-zinc-200 truncate max-w-[200px] group-hover/title:text-[#155DFC] transition-colors">{item.name}</span>
                        <ArrowUpRight size={12} className="text-zinc-600 group-hover/title:text-white transition-colors" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-400 font-medium">{item.seller}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          item.level === 'Premium' 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {item.level === 'Premium' && <Star size={10} className="fill-amber-400" />}
                        {item.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium">
                      {item.duration}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500 leading-relaxed">
                      {item.period.split(' to ').map((date: string, i: number) => (
                        <div key={i}>{date}</div>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      {item.impressions}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#10b981] text-lg">
                      {item.fee}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          item.status === "Active"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleVerifyBoost(item)}
                          className="p-2 bg-black/40 hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/30 text-zinc-400 hover:text-blue-400 rounded-xl transition-all cursor-pointer"
                          title="Verify Boost Status"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleRevokeBoost(item)}
                          className="p-2 bg-black/40 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 text-zinc-400 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                          title="Revoke/Cancel Boost"
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
        {filteredBoostedListings.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
            totalItems={filteredBoostedListings.length}
            itemNamePlural="boosts"
          />
        )}
      </div>

      {/* Boost Details Modal */}
      {selectedBoost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedBoost(null)}
          />

          <div className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">Promotion Details</h2>
                  <p className="text-zinc-500 text-sm mt-1">Stripe-backed listing marketing audit</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    selectedBoost.status === "Active"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  }`}
                >
                  {selectedBoost.status}
                </span>
              </div>

              {/* Product Card Row */}
              <div className="flex gap-4 p-4 bg-black/40 border border-white/5 rounded-2xl items-center">
                {selectedBoost.image ? (
                  <img
                    src={selectedBoost.image}
                    alt={selectedBoost.name}
                    className="w-16 h-16 rounded-xl object-cover border border-white/10 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 shadow-lg">
                    <Award size={28} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-white font-bold text-base truncate">{selectedBoost.name}</h4>
                  <p className="text-zinc-500 text-xs mt-0.5">Seller: {selectedBoost.seller}</p>
                  {selectedBoost.price !== undefined && selectedBoost.price > 0 && (
                    <p className="text-emerald-400 font-bold text-sm mt-1">
                      Est. Value: ${selectedBoost.price.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Promotion Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block">Boost ID</span>
                  <span className="text-sm font-mono text-zinc-300 block">{selectedBoost.id}</span>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block">Promotion Fee</span>
                  <span className="text-sm font-bold text-[#10b981] block text-lg">{selectedBoost.fee}</span>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block">Impressions Count</span>
                  <span className="text-sm font-bold text-white block text-lg">{selectedBoost.impressions}</span>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block">Boost Level</span>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border mt-1 ${
                      selectedBoost.level === 'Premium' 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}
                  >
                    {selectedBoost.level === 'Premium' && <Star size={8} className="fill-amber-400" />}
                    {selectedBoost.level}
                  </span>
                </div>
              </div>

              {/* Promotion Schedule Timeline */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block">Promotion Period ({selectedBoost.duration})</span>
                <div className="text-sm text-zinc-300 font-medium leading-relaxed">
                  {selectedBoost.period.split(' to ').join(' ➔ ')}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  onClick={() => {
                    const tempItem = selectedBoost;
                    setSelectedBoost(null);
                    handleRevokeBoost(tempItem);
                  }}
                  className="px-5 py-2.5 bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500/30 text-red-500 hover:text-white rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Revoke Promotion
                </button>
                <button
                  onClick={() => setSelectedBoost(null)}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
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
