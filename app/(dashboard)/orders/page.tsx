"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Eye, RefreshCcw, DollarSign, Loader2, Award, Clock, CheckCircle, Percent } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchOrders, refundOrder, OrderItem } from "@/app/store/slices/ordersSlice";
import { useAlert } from "@/app/context/AlertContext";
import ErrorState from "@/app/components/ErrorState";
import Pagination from "@/app/components/Pagination";
import OrderDetailsModal from "@/app/components/OrderDetailsModal";

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

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { items: orders, loading } = useAppSelector((state) => state.orders);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const { showAlert, showConfirm } = useAlert();

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Calculate dynamic stats
  const totalVolume = orders.reduce((sum, o) => {
    const val = typeof o.totalPrice === "number" ? o.totalPrice : parseFloat(String(o.totalPrice).replace(/[^0-9.]/g, ""));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
  const cancelledCount = orders.filter((o) => o.status === "Cancelled").length;
  
  const retentionRate = orders.length > 0 
    ? Math.round(((orders.length - cancelledCount) / orders.length) * 100)
    : 0;

  const stats = [
    {
      name: "Total Sales Volume",
      value: formatCurrency(totalVolume),
      icon: DollarSign,
      color: "text-emerald-400 border-emerald-500/20",
      bgGrad: "from-emerald-500/10 to-teal-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    },
    {
      name: "Pending Shipments",
      value: pendingCount.toLocaleString(),
      icon: Clock,
      color: "text-amber-400 border-amber-500/20",
      bgGrad: "from-amber-500/10 to-orange-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    },
    {
      name: "Completed Deliveries",
      value: deliveredCount.toLocaleString(),
      icon: CheckCircle,
      color: "text-blue-400 border-blue-500/20",
      bgGrad: "from-blue-500/10 to-indigo-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    },
    {
      name: "Order Retention Rate",
      value: `${retentionRate}%`,
      icon: Percent,
      color: "text-purple-400 border-purple-500/20",
      bgGrad: "from-purple-500/10 to-pink-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]",
    },
  ];

  const handleRefund = (order: OrderItem) => {
    showConfirm(
      `Are you sure you want to initiate a full refund for order ${order.id}?`,
      async () => {
        try {
          await dispatch(refundOrder({ orderId: order.id, paymentId: order.paymentId })).unwrap();
          showAlert(`Refund processed successfully for order ${order.id}.`, "success");
        } catch (err: any) {
          showAlert(err?.message || `Failed to process refund for order ${order.id}.`, "error");
        }
      },
      "Initiate Refund"
    );
  };

  const filteredOrders = orders.filter((order: OrderItem) => {
    const matchesSearch =
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.seller?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.item?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "All" || order.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const { error } = useAppSelector((state) => state.orders);

  if (loading && orders.length === 0) {
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
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Orders & Purchases
            {loading && <Loader2 className="animate-spin text-[#155DFC]" size={20} />}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage buyer purchases, track delivery statuses, and handle customer payouts or refunds.
          </p>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
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

      {/* Search & Filters */}
      <div className="flex gap-4 items-center">
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

        {/* Interactive Filter Dropdown Popover */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 bg-[#111111] border px-4 py-3 rounded-xl text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer ${
              isFilterOpen || statusFilter !== "All"
                ? "border-[#155DFC] text-white"
                : "border-white/5"
            }`}
          >
            <Filter size={18} />
            <span className="font-medium">Filter</span>
            {(statusFilter !== "All") && (
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
                      setStatusFilter("All");
                    }}
                    className="text-[10px] text-[#155DFC] hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>

                {/* Status Filter Pills */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Delivered", "Shipped", "Pending", "Cancelled"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          statusFilter.toLowerCase() === status.toLowerCase()
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium text-xs">Order ID</th>
                <th className="px-6 py-4 font-medium text-xs">Buyer</th>
                <th className="px-6 py-4 font-medium text-xs">Seller</th>
                <th className="px-6 py-4 font-medium text-xs">Item</th>
                <th className="px-6 py-4 font-medium text-xs">Total Price</th>
                <th className="px-6 py-4 font-medium text-xs">Status</th>
                <th className="px-6 py-4 font-medium text-xs text-center">Delivery Date</th>
                <th className="px-6 py-4 font-medium text-xs text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-zinc-500 font-medium">
                    No orders found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-zinc-500">{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#155DFC]/20 border border-[#155DFC]/30 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {order.buyer?.charAt(0) || "B"}
                        </div>
                        <span className="font-semibold text-zinc-200 truncate max-w-[120px]">{order.buyer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-400 font-medium">{order.seller}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-200 font-medium truncate max-w-[180px] block">{order.item}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#10b981] text-lg">
                      {typeof order.totalPrice === "number" ? formatCurrency(order.totalPrice) : order.totalPrice}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
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
                      <span className="text-zinc-500 text-sm font-medium">{order.deliveryDate || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 text-zinc-500">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 bg-black/40 hover:bg-[#155DFC]/20 border border-white/5 hover:border-[#155DFC]/30 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
                          title="View Order"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleRefund(order)}
                          className="p-2 bg-black/40 hover:bg-orange-500/20 border border-white/5 hover:border-orange-500/30 text-zinc-400 hover:text-orange-500 rounded-xl transition-all cursor-pointer"
                          title="Refund/Return"
                        >
                          <RefreshCcw size={16} />
                        </button>
                        <button
                          onClick={() => showAlert("Seller payouts are automatically processed and completed via Stripe Connect once the order delivery status changes to 'Delivered'.", "info")}
                          className="p-2 bg-black/40 hover:bg-green-500/20 border border-white/5 hover:border-green-500/30 text-zinc-400 hover:text-green-500 rounded-xl transition-all cursor-pointer"
                          title="Payout Info"
                        >
                          <DollarSign size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredOrders.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
            totalItems={filteredOrders.length}
            itemNamePlural="orders"
          />
        )}
      </div>

      {/* Order Invoice/Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
