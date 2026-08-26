"use client";

import React, { useState } from "react";
import { OrderItem } from "@/app/store/slices/ordersSlice";
import { useAppSelector } from "@/app/store/store";
import { X, Star, FileText, Users, ShoppingCart } from "lucide-react";

interface OrderDetailsModalProps {
  order: OrderItem | null;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"invoice" | "participants">("invoice");

  const users = useAppSelector((state) => state.users.items);

  if (!order) return null;

  // Find buyer and seller profiles
  const buyerProfile = users.find(
    (u) => u.name?.toLowerCase() === order.buyer?.toLowerCase()
  );
  const sellerProfile = users.find(
    (u) => u.name?.toLowerCase() === order.seller?.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">Order Invoice Details</h2>
            <p className="text-zinc-500 text-sm mt-0.5">ID: {order.id}</p>
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
            onClick={() => setActiveTab("invoice")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "invoice"
                ? "border-[#155DFC] text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FileText size={14} />
            Invoice Overview
          </button>
          <button
            onClick={() => setActiveTab("participants")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "participants"
                ? "border-[#155DFC] text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Users size={14} />
            Participants ({order.buyer && order.seller ? "2" : "1"})
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="p-6">
          
          {/* TAB 1: INVOICE OVERVIEW */}
          {activeTab === "invoice" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-black/40 border border-white/5 rounded-2xl">
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Order ID</span>
                  <span className="text-sm font-mono text-zinc-300 block mt-1">{order.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Item</span>
                  <span className="text-sm font-bold text-white block mt-1">{order.item}</span>
                </div>
                <div className="border-t border-white/5 pt-3 mt-1">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Buyer Name</span>
                  <span className="text-sm text-zinc-300 block mt-1">{order.buyer}</span>
                </div>
                <div className="border-t border-white/5 pt-3 mt-1">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Seller Name</span>
                  <span className="text-sm text-zinc-300 block mt-1">{order.seller}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Total Paid</span>
                  <span className="text-2xl font-extrabold text-green-500 block mt-1.5">{order.totalPrice}</span>
                </div>
                <div className="p-5 bg-black/40 border border-white/5 rounded-2xl flex flex-col justify-center">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Status</span>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                      order.status === "Delivered"
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : order.status === "Shipped"
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        : order.status === "Pending"
                        ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Delivery Date</span>
                <span className="text-sm font-semibold text-zinc-300 block mt-1">
                  {order.deliveryDate && order.deliveryDate !== "-" ? order.deliveryDate : "Pending shipment dispatch"}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: PARTICIPANTS */}
          {activeTab === "participants" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Buyer side */}
              <div className="p-5 bg-black/30 border border-white/5 rounded-2xl space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#155DFC] font-bold uppercase tracking-wider bg-[#155DFC]/10 px-2 py-0.5 rounded border border-[#155DFC]/20">Buyer</span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-base font-bold">
                      {order.buyer?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{order.buyer}</h4>
                      {buyerProfile && <p className="text-xs text-zinc-500">{buyerProfile.username}</p>}
                    </div>
                  </div>
                </div>

                {buyerProfile ? (
                  <div className="border-t border-white/5 pt-4 mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Rating:</span>
                      <span className="font-semibold text-yellow-500 flex items-center gap-0.5">
                        <Star size={12} className="fill-yellow-500" />
                        {buyerProfile.rating}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Transactions:</span>
                      <span className="font-semibold text-zinc-300">{buyerProfile.transactions}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-zinc-500 block">Email:</span>
                      <span className="text-zinc-400 font-mono block mt-0.5">{buyerProfile.email}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-600 mt-6">Profile data not loaded in store.</p>
                )}
              </div>

              {/* Seller side */}
              <div className="p-5 bg-black/30 border border-white/5 rounded-2xl space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">Seller</span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center text-white text-base font-bold">
                      {order.seller?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{order.seller}</h4>
                      {sellerProfile && <p className="text-xs text-zinc-500">{sellerProfile.username}</p>}
                    </div>
                  </div>
                </div>

                {sellerProfile ? (
                  <div className="border-t border-white/5 pt-4 mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Rating:</span>
                      <span className="font-semibold text-yellow-500 flex items-center gap-0.5">
                        <Star size={12} className="fill-yellow-500" />
                        {sellerProfile.rating}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Transactions:</span>
                      <span className="font-semibold text-zinc-300">{sellerProfile.transactions}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-zinc-500 block">Email:</span>
                      <span className="text-zinc-400 font-mono block mt-0.5">{sellerProfile.email}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-600 mt-6">Profile data not loaded in store.</p>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 rounded-xl text-sm font-semibold transition-all active:scale-95 cursor-pointer"
          >
            Close Invoice
          </button>
        </div>

      </div>
    </div>
  );
}
