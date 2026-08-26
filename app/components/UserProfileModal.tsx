"use client";

import React, { useState } from "react";
import { User } from "@/app/store/slices/usersSlice";
import { useAppSelector } from "@/app/store/store";
import { X, Star, User as UserIcon, Tag, ShoppingBag, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
}

export default function UserProfileModal({ user, onClose }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "listings" | "orders">("profile");

  const listings = useAppSelector((state) => state.listings.items);
  const orders = useAppSelector((state) => state.orders.items);

  if (!user) return null;

  // Filter listings where this user is the seller
  const userListings = listings.filter(
    (item) => item.seller?.toLowerCase() === user.name?.toLowerCase()
  );

  // Filter orders where this user is either buyer or seller
  const userOrders = orders.filter(
    (order) =>
      order.buyer?.toLowerCase() === user.name?.toLowerCase() ||
      order.seller?.toLowerCase() === user.name?.toLowerCase()
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
        
        {/* Header Block */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${user.color || 'bg-blue-600'} flex items-center justify-center text-white text-xl font-bold border border-white/10`}>
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white leading-tight">{user.name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    user.status === "Active"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}
                >
                  {user.status}
                </span>
              </div>
              <p className="text-zinc-500 text-sm mt-0.5">{user.username}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-white/5 bg-black/10 px-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "profile"
                ? "border-[#155DFC] text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <UserIcon size={14} />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("listings")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "listings"
                ? "border-[#155DFC] text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Tag size={14} />
            Active Listings ({userListings.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "orders"
                ? "border-[#155DFC] text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <ShoppingBag size={14} />
            Order History ({userOrders.length})
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* TAB 1: PROFILE INFO */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-5 bg-black/40 border border-white/5 rounded-2xl">
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">User ID</span>
                  <span className="text-sm font-mono text-zinc-300 block mt-1 select-all">{user.userId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Role</span>
                  <span className="text-sm font-bold text-blue-400 block mt-1 uppercase">{user.role}</span>
                </div>
                <div className="col-span-2 border-t border-white/5 pt-4 mt-1">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Email Address</span>
                  <span className="text-sm text-zinc-300 block mt-1">{user.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Completed Transactions</span>
                  <span className="text-3xl font-extrabold text-white block mt-1.5">{user.transactions}</span>
                </div>
                <div className="p-5 bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">User Rating</span>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Star size={20} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-3xl font-extrabold text-yellow-500">{user.rating}</span>
                    <span className="text-zinc-500 text-sm mt-2">/ 5.0</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE LISTINGS */}
          {activeTab === "listings" && (
            <div className="space-y-4">
              {userListings.length === 0 ? (
                <div className="text-center py-10 bg-black/20 border border-white/5 rounded-2xl space-y-2">
                  <Tag className="mx-auto text-zinc-600" size={32} />
                  <p className="text-zinc-500 text-sm font-medium">No active listings posted by this user.</p>
                </div>
              ) : (
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/20">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-black/30 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {userListings.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.01] transition-colors text-zinc-300">
                          <td className="px-4 py-3 font-medium text-white">{item.item}</td>
                          <td className="px-4 py-3 text-xs">{item.category}</td>
                          <td className="px-4 py-3 font-semibold text-green-500">{item.price}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                              item.status === "Live"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : item.status === "Sold"
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORDER HISTORY */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {userOrders.length === 0 ? (
                <div className="text-center py-10 bg-black/20 border border-white/5 rounded-2xl space-y-2">
                  <ShoppingBag className="mx-auto text-zinc-600" size={32} />
                  <p className="text-zinc-500 text-sm font-medium">No order transactions found for this user.</p>
                </div>
              ) : (
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/20">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-black/30 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Counterparty</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {userOrders.map((order) => {
                        const isSeller = order.seller?.toLowerCase() === user.name?.toLowerCase();
                        return (
                          <tr key={order.id} className="hover:bg-white/[0.01] transition-colors text-zinc-300">
                            <td className="px-4 py-3 font-semibold text-xs">
                              {isSeller ? (
                                <span className="text-yellow-500/80 flex items-center gap-1">
                                  <ArrowUpRight size={12} />
                                  Seller
                                </span>
                              ) : (
                                <span className="text-blue-400 flex items-center gap-1">
                                  <ArrowDownLeft size={12} />
                                  Buyer
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-white">{order.item}</td>
                            <td className="px-4 py-3 font-semibold text-zinc-100">{order.totalPrice}</td>
                            <td className="px-4 py-3 text-xs">{isSeller ? order.buyer : order.seller}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}
