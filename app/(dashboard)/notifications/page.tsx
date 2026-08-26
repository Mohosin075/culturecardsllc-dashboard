"use client";

import React, { useEffect, useState } from "react";
import { 
  ShoppingCart, 
  Repeat, 
  AlertTriangle, 
  Bell, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  Calendar,
  Inbox,
  ShieldAlert,
  Info
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type SystemNotification,
} from "@/app/store/slices/notificationsSlice";
import ErrorState from "@/app/components/ErrorState";

const categoryConfig: Record<string, { 
  icon: React.ComponentType<{ size?: number; className?: string }>; 
  badge: string; 
  iconBg: string; 
  borderGlow: string;
}> = {
  order: {
    icon: ShoppingCart,
    badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    iconBg: "bg-blue-500/10 text-blue-400",
    borderGlow: "hover:border-blue-500/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.05)]",
  },
  trade: {
    icon: Repeat,
    badge: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    iconBg: "bg-purple-500/10 text-purple-400",
    borderGlow: "hover:border-purple-500/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.05)]",
  },
  dispute: {
    icon: AlertTriangle,
    badge: "bg-red-500/10 text-red-400 border border-red-500/20",
    iconBg: "bg-red-500/10 text-red-400",
    borderGlow: "hover:border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.05)]",
  },
  system: {
    icon: Bell,
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    iconBg: "bg-amber-500/10 text-amber-400",
    borderGlow: "hover:border-amber-500/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.05)]",
  },
};

const getCategoryStyles = (type: string) => {
  return categoryConfig[type?.toLowerCase()] || {
    icon: Bell,
    badge: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
    iconBg: "bg-zinc-500/10 text-zinc-400",
    borderGlow: "hover:border-zinc-500/20 hover:shadow-[0_0_15px_rgba(161,161,170,0.05)]",
  };
};

const formatNotificationTime = (dateStr: string) => {
  const dateVal = new Date(dateStr);
  if (isNaN(dateVal.getTime())) return dateStr;

  const now = new Date();
  const diffMs = now.getTime() - dateVal.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return dateVal.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.notifications);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications());
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleMarkAllRead = async () => {
    dispatch(markAllNotificationsRead());
  };

  const handleMarkSingleRead = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation(); // prevent card click triggers
    dispatch(markNotificationRead(id));
  };

  // Adapt notification objects
  const notifications = items.map((item: SystemNotification, i: number) => ({
    id: item.id || i,
    title: item.title,
    category: item.category || (item.read ? "Processed" : "Unread Action"),
    content: item.text,
    time: item.date || "Just now",
    type: item.type || "system",
    isUnread: !item.read,
  }));

  // Filtering
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return n.isUnread;
    return n.type.toLowerCase() === activeTab;
  });

  // Category counts
  const allCount = notifications.length;
  const unreadCount = notifications.filter((n) => n.isUnread).length;
  const orderCount = notifications.filter((n) => n.type.toLowerCase() === "order").length;
  const tradeCount = notifications.filter((n) => n.type.toLowerCase() === "trade").length;
  const disputeCount = notifications.filter((n) => n.type.toLowerCase() === "dispute").length;
  const systemCount = notifications.filter((n) => n.type.toLowerCase() === "system").length;

  // Group notifications chronologically
  const groupNotifications = (list: typeof filteredNotifications) => {
    const today: typeof filteredNotifications = [];
    const yesterday: typeof filteredNotifications = [];
    const earlier: typeof filteredNotifications = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    list.forEach(notif => {
      const dateVal = new Date(notif.time);
      if (isNaN(dateVal.getTime())) {
        today.push(notif); // Relative times go to Today
      } else {
        if (dateVal >= todayStart) {
          today.push(notif);
        } else if (dateVal >= yesterdayStart) {
          yesterday.push(notif);
        } else {
          earlier.push(notif);
        }
      }
    });

    return { today, yesterday, earlier };
  };

  const grouped = groupNotifications(filteredNotifications);

  if (loading && !refreshing) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-zinc-800 rounded-lg"></div>
            <div className="h-4 w-32 bg-zinc-800/60 rounded-md"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-zinc-800 rounded-xl"></div>
            <div className="h-10 w-36 bg-zinc-800 rounded-xl"></div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900 border border-white/5 rounded-2xl"></div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="h-10 bg-zinc-900 rounded-xl w-full"></div>

        {/* List Skeleton */}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 bg-zinc-900/40 border border-white/5 rounded-2xl h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchNotifications())} />;
  }

  const renderSection = (title: string, list: typeof filteredNotifications) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <Calendar size={12} />
          <span>{title}</span>
        </div>
        <div className="space-y-3">
          {list.map((notif) => {
            const { icon: Icon, badge: badgeClass, iconBg: iconBgClass, borderGlow: glowClass } = getCategoryStyles(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => notif.isUnread && dispatch(markNotificationRead(notif.id))}
                className={`group relative p-5 bg-[#121214]/60 border rounded-2xl transition-all duration-300 cursor-pointer ${
                  notif.isUnread 
                    ? "border-blue-500/20 shadow-md shadow-blue-500/[0.01]" 
                    : "border-white/5 opacity-80 hover:opacity-100"
                } ${glowClass}`}
              >
                {/* Glowing Active Border Dot */}
                {notif.isUnread && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-blue-500 rounded-r-full" />
                )}

                <div className="flex gap-4">
                  {/* Left Side: Category Icon Container */}
                  <div className={`w-11 h-11 ${iconBgClass} rounded-xl flex items-center justify-center shrink-0 shadow-inner`}>
                    <Icon size={20} />
                  </div>

                  {/* Middle Content Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className={`font-semibold text-sm transition-colors ${notif.isUnread ? 'text-white' : 'text-zinc-300'}`}>
                            {notif.title}
                          </h3>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${badgeClass}`}>
                            {notif.category}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-zinc-500 whitespace-nowrap pt-0.5 shrink-0">
                        {formatNotificationTime(notif.time)}
                      </span>
                    </div>

                    <p className="text-zinc-400 text-sm leading-relaxed mt-2.5 pr-8">
                      {notif.content}
                    </p>
                  </div>

                  {/* Right Side Hover Actions */}
                  {notif.isUnread && (
                    <div className="flex items-center self-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pl-2">
                      <button
                        onClick={(e) => handleMarkSingleRead(e, notif.id)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400 flex items-center justify-center transition-all shadow cursor-pointer active:scale-90"
                        title="Mark as Read"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            System Notifications
            <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-full border border-blue-500/20 font-semibold font-mono">
              {unreadCount} Unread
            </span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed">
            Monitor transaction events, disputes, trade offers, and system health status.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            className="w-10 h-10 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-white/5 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
            title="Refresh List"
          >
            <RefreshCw size={16} className={`${refreshing ? "animate-spin text-blue-400" : ""}`} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="bg-[#155DFC] hover:bg-blue-600 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/10 border border-blue-400/20"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-[#121214]/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Logs</span>
            <p className="text-2xl font-bold text-white font-mono">{allCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400">
            <Inbox size={18} />
          </div>
        </div>

        {/* Card 2: Unread */}
        <div className="bg-[#121214]/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Unread Alerts</span>
            <p className="text-2xl font-bold text-blue-400 font-mono">{unreadCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Bell size={18} />
          </div>
        </div>

        {/* Card 3: Active Disputes */}
        <div className="bg-[#121214]/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Disputes</span>
            <p className="text-2xl font-bold text-red-400 font-mono">{disputeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert size={18} />
          </div>
        </div>

        {/* Card 4: Orders */}
        <div className="bg-[#121214]/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Orders</span>
            <p className="text-2xl font-bold text-emerald-400 font-mono">{orderCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShoppingCart size={18} />
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2 border-b border-white/5 pb-2 overflow-x-auto scrollbar-none">
        {[
          { key: "all", label: "All", count: allCount },
          { key: "unread", label: "Unread", count: unreadCount },
          { key: "order", label: "Orders", count: orderCount },
          { key: "trade", label: "Trades", count: tradeCount },
          { key: "dispute", label: "Disputes", count: disputeCount },
          { key: "system", label: "System", count: systemCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              activeTab === tab.key
                ? "bg-[#155DFC]/10 border-blue-500/30 text-blue-400 shadow-md shadow-blue-500/[0.02]"
                : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
              activeTab === tab.key ? "bg-blue-500/20 text-blue-300" : "bg-zinc-800/80 text-zinc-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notification Lists Grouped Chronologically */}
      <div className="space-y-6">
        {filteredNotifications.length === 0 ? (
          <div className="relative overflow-hidden bg-[#121214]/20 border border-white/5 rounded-3xl p-16 text-center flex flex-col items-center justify-center space-y-5">
            {/* Visual background glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 relative z-10">
              <Bell size={28} className="text-zinc-600 animate-pulse" />
            </div>
            
            <div className="space-y-2 relative z-10">
              <h3 className="text-lg font-bold text-zinc-200">All caught up!</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
                {activeTab === "all" 
                  ? "You don't have any notifications logged. Everything is quiet." 
                  : `No notifications found matching filter "${activeTab}".`}
              </p>
            </div>
            
            {activeTab !== "all" && (
              <button
                onClick={() => setActiveTab("all")}
                className="relative z-10 text-xs text-blue-400 hover:text-blue-300 border-b border-blue-400/20 hover:border-blue-300/40 pb-0.5 transition-all cursor-pointer font-bold"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-7">
            {renderSection("Today", grouped.today)}
            {renderSection("Yesterday", grouped.yesterday)}
            {renderSection("Earlier", grouped.earlier)}
          </div>
        )}
      </div>
    </div>
  );
}
