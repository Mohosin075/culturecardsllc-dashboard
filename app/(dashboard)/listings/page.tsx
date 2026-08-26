"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Eye, Trash2, Star, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchListings, deleteListing, toggleBoostListing, Listing } from "@/app/store/slices/listingsSlice";
import { useAlert } from "@/app/context/AlertContext";
import ErrorState from "@/app/components/ErrorState";
import Pagination from "@/app/components/Pagination";

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

  const filteredListings = listings.filter(
    (item: Listing) =>
      item.item?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

      {/* Search and Filter */}
      <div className="flex gap-4">
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
        <button className="flex items-center gap-2 bg-[#111111] border border-white/5 px-4 py-2 rounded-xl text-zinc-300 hover:bg-white/5 transition-colors">
          <Filter size={18} />
          <span className="font-medium">More Filters</span>
        </button>
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
                    <div className="flex items-center gap-3 text-zinc-500">
                      <button
                        onClick={() => setSelectedListing(item)}
                        className="hover:text-white transition-colors"
                        title="View Listing Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteListing(item.id)}
                        className="hover:text-red-500 transition-colors"
                        title="Delete Listing"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => handleToggleBoost(item.id, item.boosted)}
                        className={`${item.boosted ? 'text-yellow-500' : 'hover:text-white'} transition-colors`}
                        title="Toggle Boost"
                      >
                        <Star size={18} className={item.boosted ? "fill-yellow-500" : ""} />
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
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedListing(null)}
          />

          <div className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedListing.item}</h2>
                  <p className="text-zinc-500 text-sm mt-1">Listing details and metrics</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    selectedListing.status === "Live"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : selectedListing.status === "Sold"
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}
                >
                  {selectedListing.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-black/40 border border-white/5 rounded-2xl">
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Listing ID</span>
                  <span className="text-sm font-mono text-zinc-300 block mt-1">{selectedListing.id}</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Category</span>
                  <span className="text-sm font-medium text-blue-400 block mt-1">{selectedListing.category}</span>
                </div>
                <div className="col-span-2 border-t border-white/5 pt-3">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Seller</span>
                  <span className="text-sm text-zinc-300 block mt-1">{selectedListing.seller}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Price</span>
                  <span className="text-lg font-bold text-green-500 block mt-1">{selectedListing.price}</span>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Views</span>
                  <span className="text-lg font-bold text-white block mt-1">{selectedListing.views}</span>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Boosted</span>
                  <span className="text-lg font-bold text-yellow-500 block mt-1">{selectedListing.boosted ? "Yes" : "No"}</span>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 rounded-xl text-sm font-semibold transition-all active:scale-95"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
