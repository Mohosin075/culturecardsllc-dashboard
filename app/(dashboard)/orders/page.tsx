"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Eye, RefreshCcw, DollarSign, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchOrders, refundOrder, OrderItem } from "@/app/store/slices/ordersSlice";
import { useAlert } from "@/app/context/AlertContext";
import ErrorState from "@/app/components/ErrorState";
import Pagination from "@/app/components/Pagination";

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { items: orders, loading } = useAppSelector((state) => state.orders);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleRefund = (order: OrderItem) => {
    showConfirm(
      `Are you sure you want to initiate a full refund for order ${order.id}?`,
      () => {
        dispatch(refundOrder({ orderId: order.id, paymentId: order.paymentId }));
        showAlert(`Refund initiated for order ${order.id}.`, "success");
      },
      "Initiate Refund"
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredOrders = orders.filter(
    (order: OrderItem) =>
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.seller?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.item?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const { error } = useAppSelector((state) => state.orders);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#155DFC]" size={40} />
      </div>
    );
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchOrders())} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Orders & Purchases</h1>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search orders by ID, buyer, seller, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-zinc-300 focus:outline-none focus:border-[#155DFC] transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 bg-[#111111] border border-white/5 px-4 py-2 rounded-xl text-zinc-300 hover:bg-white/5 transition-colors">
          <Filter size={18} />
          <span className="font-medium">Filter</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500 text-sm">
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Buyer</th>
                <th className="px-6 py-4 font-medium">Seller</th>
                <th className="px-6 py-4 font-medium">Item</th>
                <th className="px-6 py-4 font-medium">Total Price</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-center">Delivery Date</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-zinc-500">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {order.buyer?.charAt(0) || "B"}
                      </div>
                      <span className="font-medium truncate max-w-[120px]">{order.buyer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-400 text-sm">{order.seller}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-200 text-sm font-medium">{order.item}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#10b981] text-lg">
                    {order.totalPrice}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        order.status === "Delivered"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : order.status === "Shipped"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : order.status === "Pending"
                          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-zinc-500 text-sm">{order.deliveryDate || "—"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-zinc-500">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="hover:text-white transition-colors"
                        title="View Order"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleRefund(order)}
                        className="hover:text-blue-400 transition-colors"
                        title="Refund/Return"
                      >
                        <RefreshCcw size={18} />
                      </button>
                      <button
                        onClick={() => showConfirm(`Initiate seller payout of ${order.totalPrice} to ${order.seller}?`, () => showAlert(`Payout of ${order.totalPrice} processed successfully.`, "success"), "Seller Payout")}
                        className="hover:text-yellow-500 transition-colors"
                        title="Payout"
                      >
                        <DollarSign size={18} />
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
          totalItems={filteredOrders.length}
          itemNamePlural="orders"
        />
      </div>

      {/* Order Invoice/Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">Invoice details</h2>
                  <p className="text-zinc-500 text-sm mt-1">Order and shipping overview</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    selectedOrder.status === "Delivered"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : selectedOrder.status === "Shipped"
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : selectedOrder.status === "Pending"
                      ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-black/40 border border-white/5 rounded-2xl">
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Order ID</span>
                  <span className="text-sm font-mono text-zinc-300 block mt-1">{selectedOrder.id}</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Item Purchased</span>
                  <span className="text-sm font-medium text-white block mt-1">{selectedOrder.item}</span>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Buyer</span>
                  <span className="text-sm text-zinc-300 block mt-1">{selectedOrder.buyer}</span>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Seller</span>
                  <span className="text-sm text-zinc-300 block mt-1">{selectedOrder.seller}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Total Amount Paid</span>
                  <span className="text-2xl font-bold text-green-500 block mt-1">{selectedOrder.totalPrice}</span>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block">Delivery Date</span>
                  <span className="text-sm font-semibold text-white block mt-2">{selectedOrder.deliveryDate || "Pending shipment"}</span>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 rounded-xl text-sm font-semibold transition-all active:scale-95"
                >
                  Close Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
