"use client";

import React, { useEffect } from "react";
import { ShoppingCart, Repeat, AlertTriangle, Bell, CheckCircle2, Loader2 } from "lucide-react";


const categoryIconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  "order": ShoppingCart,
  "trade": Repeat,
  "dispute": AlertTriangle,
  "system": Bell,
};

const getIconByType = (type: string) => {
  return categoryIconMap[type?.toLowerCase()] || Bell;
};

const getColorByType = (type: string) => {
  switch (type?.toLowerCase()) {
    case "order": return "bg-blue-600";
    case "trade": return "bg-purple-600";
    case "dispute": return "bg-red-600";
    default: return "bg-yellow-600";
  }
};

import { useAppDispatch, useAppSelector } from "@/app/store/store";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type SystemNotification,
} from "@/app/store/slices/notificationsSlice";
import ErrorState from "@/app/components/ErrorState";

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAllRead = async () => {
    dispatch(markAllNotificationsRead());
  };

  const handleMarkSingleRead = (id: string | number) => {
    dispatch(markNotificationRead(id));
  };

  // Adapt notification objects
  const notifications = items.map((item: SystemNotification, i: number) => ({
    id: item.id || i,
    title: item.title,
    category: item.category || (item.read ? "Read Notification" : "New Notification"),
    content: item.text,
    time: item.date || "Just now",
    type: item.type || "system",
    isUnread: !item.read,
  }));

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const { error } = useAppSelector((state) => state.notifications);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#155DFC]" size={40} />
      </div>
    );
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchNotifications())} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">System Notifications</h1>
          <p className="text-zinc-500 mt-1">{unreadCount} unread notifications</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="bg-[#155DFC] hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95"
        >
          Mark All as Read
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500">
              <Bell size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-200">No Notifications</h3>
              <p className="text-sm text-zinc-500 max-w-sm">
                You do not have any notifications right now.
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notif) => {
            const Icon = getIconByType(notif.type);
            const colorClass = getColorByType(notif.type);
            return (
              <div
                key={notif.id}
                className={`group relative p-4 bg-[#111111] border rounded-2xl transition-all duration-200 ${
                  notif.isUnread 
                    ? "border-blue-500/30 shadow-lg shadow-blue-500/5" 
                    : "border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center text-white shrink-0`}>
                    <Icon size={20} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-100">{notif.title}</h3>
                        {notif.isUnread && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">{notif.time}</span>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">{notif.category}</p>
                    <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
                      {notif.content}
                    </p>
                  </div>

                  {/* Hover Actions */}
                  {notif.isUnread && (
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMarkSingleRead(notif.id)}
                        className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        title="Mark as Read"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
