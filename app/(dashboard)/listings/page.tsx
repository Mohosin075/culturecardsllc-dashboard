"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Eye, Trash2, Star, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchListings, deleteListing, toggleBoostListing, Listing } from "@/app/store/slices/listingsSlice";
import { useAlert } from "@/app/context/AlertContext";
import ErrorState from "@/app/components/ErrorState";
import Pagination from "@/app/components/Pagination";
import ListingDetailsModal from "@/app/components/ListingDetailsModal";

export default function ListingsPage() {
  const dispatch = useAppDispatch();
  const { items: listings, loading } = useAppSelector((state) => state.listings);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    dispatch(fetchListings());
  }, [dispatch]);

  const handleDeleteListing = async (productId: string) => {
    showConfirm(
      "Are you sure you want to delete this listing? This action cannot be undone.",
      () => {
        dispatch(deleteListing(productId));
        showAlert("Listing deleted successfully.", "success");
      },
      "Delete Listing"
    );
  };

  const handleToggleBoost = (productId: string, boosted: boolean) => {
    const actionText = boosted ? "remove boost from" : "boost";
    showConfirm(
      `Are you sure you want to ${actionText} this listing?`,
      () => {
        dispatch(toggleBoostListing({ id: productId, boosted }));
        showAlert(`Listing ${boosted ? "unboosted" : "boosted"} successfully.`, "success");
      },
      "Boost Status"
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [boostFilter, setBoostFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredListings = listings.filter((item: Listing) => {
    const matchesSearch =
      item.item?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = categoryFilter === "All" || item.category?.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStatus = statusFilter === "All" || item.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesBoost = boostFilter === "All" || (boostFilter === "Boosted" ? item.boosted : !item.boosted);

    return matchesSearch && matchesCategory && matchesStatus && matchesBoost;
  });

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter, boostFilter]);

  const totalPages = Math.ceil(filteredListings.length / rowsPerPage);
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const { error } = useAppSelector((state) => state.listings);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#155DFC]" size={40} />
      </div>
    );
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchListings())} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Listings Management</h1>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search listings by item, seller, or category..."
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
              isFilterOpen || categoryFilter !== "All" || statusFilter !== "All" || boostFilter !== "All"
                ? "border-[#155DFC] text-white"
                : "border-white/5"
            }`}
          >
            <Filter size={18} />
            <span className="font-medium">Filter</span>
            {(categoryFilter !== "All" || statusFilter !== "All" || boostFilter !== "All") && (
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
                      setCategoryFilter("All");
                      setStatusFilter("All");
                      setBoostFilter("All");
                    }}
                    className="text-[10px] text-[#155DFC] hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>

                {/* Category Filter Pills */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Sneakers", "Cards", "Watches", "Fine Art", "TCG"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          categoryFilter === cat
                            ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/20"
                            : "bg-black/40 text-zinc-400 hover:text-white border border-white/5"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter Pills */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Live", "Sold", "Removed"].map((status) => (
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

                {/* Boost Filter Pills */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Featured Boost</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Boosted", "Standard"].map((boost) => (
                      <button
                        key={boost}
                        onClick={() => setBoostFilter(boost)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          boostFilter === boost
                            ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/20"
                            : "bg-black/40 text-zinc-400 hover:text-white border border-white/5"
                        }`}
                      >
                        {boost === "All" ? "All" : boost === "Boosted" ? "Boosted" : "Standard"}
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
              <tr className="border-b border-white/5 text-zinc-500 text-sm">
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Listing ID</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Seller</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Views</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Boosted</th>
                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedListings.map((item) => (
                <tr key={item.id} className="text-zinc-300 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 text-sm font-mono text-zinc-500">{item.id}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium">{item.seller}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-200">{item.item}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#10b981] text-lg">
                    {item.price}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-[#155DFC]/10 text-[#155DFC] px-3 py-1 rounded-full text-xs font-medium border border-[#155DFC]/20">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 font-medium">
                    {item.views}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        item.status === "Live"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : item.status === "Sold"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.boosted ? (
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <button
                        onClick={() => setSelectedListing(item)}
                        className="p-2 bg-black/40 hover:bg-[#155DFC]/20 border border-white/5 hover:border-[#155DFC]/30 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
                        title="View Listing Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteListing(item.id)}
                        className="p-2 bg-black/40 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 text-zinc-400 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                        title="Delete Listing"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleBoost(item.id, item.boosted)}
                        className={`p-2 bg-black/40 border border-white/5 rounded-xl transition-all cursor-pointer ${
                          item.boosted
                            ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20"
                            : "hover:bg-yellow-500/20 hover:border-yellow-500/30 text-zinc-400 hover:text-yellow-500"
                        }`}
                        title="Toggle Boost"
                      >
                        <Star size={16} className={item.boosted ? "fill-yellow-500" : ""} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={setRowsPerPage}
          totalItems={filteredListings.length}
          itemNamePlural="listings"
        />
      </div>

      {/* Listing Details Modal */}
      <ListingDetailsModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
      />
    </div>
  );
}
