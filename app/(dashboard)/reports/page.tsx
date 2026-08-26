"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Loader2,
  Calendar,
  Search,
  Download,
  ArrowUpRight,
  Activity,
  Check
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchReports } from "@/app/store/slices/reportsSlice";
import ErrorState from "@/app/components/ErrorState";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  "total sales": TrendingUp,
  "active users": Users,
  "avg transaction": DollarSign,
};

const getIconByName = (name: string) => {
  return iconMap[name.toLowerCase()] || TrendingUp;
};

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#ec4899"];

// Custom Premium Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#121214]/90 border border-white/10 backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl space-y-1">
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
        {payload.map((entry: any, index: number) => {
          const value = typeof entry.value === "number" ? entry.value : 0;
          const formattedVal =
            entry.name.toLowerCase().includes("sales") || entry.name.toLowerCase().includes("amount")
              ? `$${value.toLocaleString()}`
              : value.toLocaleString();
          return (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-white text-sm font-semibold">
                {entry.name}: {formattedVal}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.reports);

  const [range, setRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchReports(range));
  }, [dispatch, range]);

  // Download CSV logic mock
  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      // Create headers
      let csvContent = "data:text/csv;charset=utf-8,";
      if (activeTab === "categories") {
        csvContent += "Category Name,Sales Volume\n";
        categoryData.forEach((row: any) => {
          csvContent += `"${row.name}",${row.sales}\n`;
        });
      } else {
        csvContent += "Seller Name,Sales Amount\n";
        sellerData.forEach((row: any) => {
          csvContent += `"${row.name}",${row.sales}\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `culture_cards_report_${range}_${activeTab}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    }, 800);
  };

  // Show loading indicator on first load only (when data is null)
  if (loading && !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#155DFC]" size={48} />
          <p className="text-zinc-500 text-sm font-medium tracking-wide animate-pulse">
            Analyzing statistics & aggregations...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error || undefined} onRetry={() => dispatch(fetchReports(range))} />;
  }

  // Safely map backend data
  const summary = data?.summary || {
    totalSales: 180000,
    totalSalesChange: "+12.5%",
    activeUsers: 12540,
    activeUsersChange: "+19.4%",
    avgTransaction: 478,
    avgTransactionChange: "+5.2%",
  };

  const stats = [
    {
      name: "Total Sales",
      value: `$${summary.totalSales.toLocaleString()}`,
      growth: summary.totalSalesChange,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "hover:border-indigo-500/30",
      bgGrad: "bg-gradient-to-r from-indigo-500 to-purple-600",
      shadow: "hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]",
      isPositive: !summary.totalSalesChange.startsWith("-"),
    },
    {
      name: "Active Users",
      value: summary.activeUsers.toLocaleString(),
      growth: summary.activeUsersChange,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "hover:border-emerald-500/30",
      bgGrad: "bg-gradient-to-r from-emerald-500 to-teal-600",
      shadow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
      isPositive: !summary.activeUsersChange.startsWith("-"),
    },
    {
      name: "Avg Transaction",
      value: `$${summary.avgTransaction.toLocaleString()}`,
      growth: summary.avgTransactionChange,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "hover:border-amber-500/30",
      bgGrad: "bg-gradient-to-r from-amber-500 to-orange-600",
      shadow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
      isPositive: !summary.avgTransactionChange.startsWith("-"),
    },
  ];

  const categoryData = data?.salesByCategory
    ? data.salesByCategory.map((item: any) => ({
        name: item.category,
        sales: item.amount,
      }))
    : [
        { name: "Sneakers", sales: 45000 },
        { name: "Watches", sales: 80000 },
        { name: "Cards", sales: 22000 },
        { name: "Tech", sales: 32000 },
      ];

  const sellerData = data?.topSellers
    ? data.topSellers.map((item: any) => ({
        name: item.name,
        sales: item.salesAmount,
      }))
    : [
        { name: "SneakerKing", sales: 12000 },
        { name: "WatchMaster", sales: 18000 },
        { name: "CardCollector", sales: 9000 },
        { name: "TechDeals", sales: 12000 },
        { name: "LuxuryTime", sales: 25000 },
      ];

  const tradedItemsData = data?.mostTradedItems
    ? data.mostTradedItems.map((item: any) => ({
        name: item.category,
        value: item.percentage,
      }))
    : [
        { name: "Sneakers", value: 38 },
        { name: "Cards", value: 27 },
        { name: "Tech", value: 21 },
        { name: "Watches", value: 15 },
      ];

  const engagementData = data?.userEngagement
    ? data.userEngagement.map((item: any) => ({
        name: item.month,
        active: item.activeUsers,
        new: item.newUsers,
      }))
    : [
        { name: "Jan", active: 8000, new: 1200 },
        { name: "Feb", active: 9000, new: 1500 },
        { name: "Mar", active: 10500, new: 1800 },
        { name: "Apr", active: 12540, new: 2200 },
      ];

  // Table sorting / filtering
  const tableData = activeTab === "categories" ? categoryData : sellerData;
  const filteredTableData = tableData.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ranges = [
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "90 Days", value: "90d" },
    { label: "1 Year", value: "1y" },
    { label: "All Time", value: "all" },
  ];

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Reports & Analytics
            {loading && <Loader2 className="animate-spin text-indigo-500" size={24} />}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Real-time sales, trading volumes, and engagement metrics.
          </p>
        </div>

        {/* Premium Frame Picker */}
        <div className="flex bg-[#121214] p-1.5 rounded-xl border border-white/5 backdrop-blur-md items-center gap-1 self-start md:self-auto">
          <Calendar size={14} className="text-zinc-500 ml-2 mr-1" />
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                range === r.value
                  ? "bg-white/10 text-white shadow-md"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = getIconByName(stat.name);
          return (
            <div
              key={stat.name}
              className={`group relative bg-[#111111] border border-white/5 p-6 rounded-2xl space-y-4 hover:border-white/10 ${stat.shadow} transition-all duration-300 transform hover:-translate-y-1 overflow-hidden`}
            >
              {/* Colored Glow/Gradient Strip */}
              <div
                className={`absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${stat.bgGrad}`}
              />

              <div className="flex items-center justify-between">
                <p className="text-zinc-500 text-sm font-medium">{stat.name}</p>
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon size={18} />
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-extrabold text-white mt-1 tracking-tight">{stat.value}</h3>
                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      stat.isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {stat.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {stat.growth}
                  </span>
                  <span className="text-zinc-600 text-[11px] font-medium">vs prior period</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Aggregation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category Area/Bar */}
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100">Sales by Category</h2>
            <span className="text-[11px] font-semibold tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase">
              Financial
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="indigoPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar name="Sales Amount" dataKey="sales" fill="url(#indigoPurpleGrad)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Sellers Chart */}
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100">Top Sellers</h2>
            <span className="text-[11px] font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase">
              Performance
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sellerData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldTealGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" horizontal={false} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar name="Sales Volume" dataKey="sales" fill="url(#emeraldTealGrad)" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Traded Items Donut */}
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100">Most Traded Items</h2>
            <span className="text-[11px] font-semibold tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase">
              Trading Swap
            </span>
          </div>
          <div className="h-[300px] w-full flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={tradedItemsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tradedItemsData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Engagement AreaChart */}
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100">User Engagement</h2>
            <span className="text-[11px] font-semibold tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full uppercase">
              Growth
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="activeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="newAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  name="Active Users"
                  dataKey="active"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#activeAreaGrad)"
                />
                <Area
                  type="monotone"
                  name="New Signups"
                  dataKey="new"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#newAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Tables Breakdown */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("categories");
                setSearchQuery("");
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "categories"
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Category Breakdown
            </button>
            <button
              onClick={() => {
                setActiveTab("sellers");
                setSearchQuery("");
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "sellers"
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Seller Leaderboard
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex items-center bg-[#16161a] border border-white/5 rounded-xl px-3 py-1.5 focus-within:border-indigo-500/50 transition duration-300">
              <Search size={14} className="text-zinc-500 mr-2" />
              <input
                type="text"
                placeholder={activeTab === "categories" ? "Search categories..." : "Search sellers..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-zinc-500 outline-none w-full sm:w-[180px]"
              />
            </div>

            {/* Export Action */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all duration-150"
            >
              {exporting ? (
                <Loader2 className="animate-spin" size={14} />
              ) : exportSuccess ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <Download size={14} />
              )}
              {exporting ? "Generating..." : exportSuccess ? "Downloaded" : "Export CSV"}
            </button>
          </div>
        </div>

        {/* Leaderboard list */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-4">#</th>
                <th className="py-4 px-4">{activeTab === "categories" ? "Category Name" : "Seller Name"}</th>
                <th className="py-4 px-4 text-right">Revenue Generated</th>
                <th className="py-4 px-4 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-zinc-300 font-medium">
              {filteredTableData.length > 0 ? (
                filteredTableData.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition duration-200">
                    <td className="py-4 px-4 text-zinc-600 text-xs font-bold">{idx + 1}</td>
                    <td className="py-4 px-4 flex items-center gap-2 text-white">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      {item.name}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-white">
                      ${item.sales.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center gap-0.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <ArrowUpRight size={12} />
                        +{Math.round((item.sales / (summary.totalSales || 1)) * 100)}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500 text-sm">
                    No matches found for &quot;{searchQuery}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
