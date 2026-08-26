"use client";

import React, { useEffect, useState } from "react";
import { Star, CheckCircle2, Loader2, Search, Filter } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchBoostedListings, BoostedListing } from "@/app/store/slices/boostedListingsSlice";
import ErrorState from "@/app/components/ErrorState";
import Pagination from "@/app/components/Pagination";

export default function BoostedListingsPage() {
  const dispatch = useAppDispatch();
  const { items: boostedListings, loading } = useAppSelector((state) => state.boostedListings);

  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchBoostedListings());
  }, [dispatch]);

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

  const { error } = useAppSelector((state) => state.boostedListings);

  if (loading) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Boosted Listings</h1>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search by ID, name, or seller..."
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
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
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
                <th className="px-6 py-4 font-medium text-center text-xs">Action</th>
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
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-yellow-500 fill-yellow-500 shrink-0" />
                        <span className="font-medium text-zinc-200 truncate max-w-[200px]">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-400 font-medium">{item.seller}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          item.level === 'Premium' 
                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}
                      >
                        {item.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
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
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          item.status === "Active"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => alert("Verification check completed for boost subscription.")}
                          className="p-2 bg-black/40 hover:bg-green-500/20 border border-white/5 hover:border-green-500/30 text-zinc-400 hover:text-green-500 rounded-xl transition-all cursor-pointer"
                          title="Verify Boost Status"
                        >
                          <CheckCircle2 size={16} />
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
    </div>
  );
}
