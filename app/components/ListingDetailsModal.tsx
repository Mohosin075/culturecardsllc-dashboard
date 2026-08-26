"use client";

import React, { useState } from "react";
import { Listing } from "@/app/store/slices/listingsSlice";
import { useAppSelector } from "@/app/store/store";
import { X, Star, FileText, User, Eye } from "lucide-react";

interface ListingDetailsModalProps {
  listing: Listing | null;
  onClose: () => void;
}

export default function ListingDetailsModal({ listing, onClose }: ListingDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "seller">("info");

  const users = useAppSelector((state) => state.users.items);

  if (!listing) return null;

  // Try to find the matching seller user profile in store
  const sellerProfile = users.find(
    (u) => u.name?.toLowerCase() === listing.seller?.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">{listing.item}</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Listing #{listing.id}</p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 bg-black/10 px-4">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "info"
                ? "border-[#155DFC] text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FileText size={14} />
            Listing Info
          </button>
          <button
            onClick={() => setActiveTab("seller")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "seller"
                ? "border-[#155DFC] text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <User size={14} />
            Seller Profile
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="p-6">
          
          {/* TAB 1: LISTING INFO */}
          {activeTab === "info" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-black/40 border border-white/5 rounded-2xl">
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Listing ID</span>
                  <span className="text-sm font-mono text-zinc-300 block mt-1">{listing.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Category</span>
                  <span className="text-sm font-bold text-blue-400 block mt-1 uppercase">{listing.category}</span>
                </div>
                <div className="col-span-2 border-t border-white/5 pt-3 mt-1">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Seller</span>
                  <span className="text-sm text-zinc-300 block mt-1 font-medium">{listing.seller}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Price</span>
                  <span className="text-base font-bold text-green-500 block mt-1">{listing.price}</span>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Views</span>
                  <span className="text-base font-bold text-white block mt-1">{listing.views}</span>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border mt-1.5 ${
                    listing.status === "Live"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : listing.status === "Sold"
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}>
                    {listing.status}
                  </span>
                </div>
              </div>

              {listing.boosted && (
                <div className="flex items-center gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl text-yellow-500 text-sm">
                  <Star size={18} className="fill-yellow-500 shrink-0" />
                  <span className="font-semibold">This listing is currently boosted and featured in recommendations.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SELLER DETAILS */}
          {activeTab === "seller" && (
            <div className="space-y-4">
              {!sellerProfile ? (
                <div className="p-5 bg-black/20 border border-white/5 rounded-2xl text-center space-y-2">
                  <p className="text-zinc-400 text-sm font-semibold">{listing.seller}</p>
                  <p className="text-xs text-zinc-500">Detailed seller profile data not loaded in store.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-black/40 border border-white/5 rounded-2xl justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${sellerProfile.color || 'bg-blue-600'} flex items-center justify-center text-white text-lg font-bold`}>
                        {sellerProfile.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{sellerProfile.name}</h3>
                        <p className="text-xs text-zinc-500">{sellerProfile.username}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      sellerProfile.status === "Active"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                      {sellerProfile.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-center">
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Seller Rating</span>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-white">{sellerProfile.rating} / 5.0</span>
                      </div>
                    </div>
                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-center">
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Transactions</span>
                      <span className="text-sm font-bold text-white block mt-1">{sellerProfile.transactions}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Contact Email</span>
                    <span className="text-sm text-zinc-300 block mt-1">{sellerProfile.email}</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 rounded-xl text-sm font-semibold transition-all active:scale-95 cursor-pointer"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
