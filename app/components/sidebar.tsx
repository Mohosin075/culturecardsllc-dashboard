"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Package,
  Radio,
  Repeat,
  ShoppingCart,
  AlertTriangle,
  DollarSign,
  Zap,
  LayoutGrid,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api, useApiStatus } from "@/app/lib/api";

const menuItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/overview" },
  { name: "Users", icon: Users, href: "/users" },
  { name: "Seller Verification", icon: ShieldCheck, href: "/seller-verification" },
  { name: "Listings", icon: Package, href: "/listings" },
  { name: "Live Streams", icon: Radio, href: "/live-streams" },
  { name: "Trades", icon: Repeat, href: "/trades" },
  { name: "Orders", icon: ShoppingCart, href: "/orders" },
  { name: "Disputes", icon: AlertTriangle, href: "/disputes" },
  { name: "Payments", icon: DollarSign, href: "/payments" },
  { name: "Boosted Listings", icon: Zap, href: "/boosted-listings" },
  { name: "Categories", icon: LayoutGrid, href: "/categories" },
  { name: "Notifications", icon: Bell, href: "/notifications" },
  { name: "Reports", icon: BarChart3, href: "/reports" },
  { name: "Terms & Privacy", icon: FileText, href: "/legal" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isLive = useApiStatus();

  const handleLogout = async () => {
    await api.auth.logout();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-[#111111] border-r border-white/5 flex flex-col h-screen sticky top-0 overflow-hidden">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-white">Admin Dashboard</h1>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon
                size={20}
                className={isActive ? "text-white" : "text-zinc-500 group-hover:text-white"}
              />
              <span className={`text-sm font-medium`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-4">
        <div className="flex items-center justify-between px-3 py-2 bg-black/40 border border-white/5 rounded-xl">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">API Status</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            <span className={`text-[10px] font-bold ${isLive ? 'text-green-500' : 'text-yellow-500'}`}>
              {isLive ? 'LIVE' : 'DEMO'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all duration-200 group"
        >
          <LogOut size={20} className="text-red-500" />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </aside>
  );
}
