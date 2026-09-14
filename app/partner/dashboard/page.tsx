"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Handshake,
  Users,
  DollarSign,
  TrendingUp,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { api } from "@/app/lib/api";

function PartnerDashboardContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    accountNumber: "",
    routingNumber: "",
    bankName: "",
    accountHolderName: "",
  });
  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [bankSuccess, setBankSuccess] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  const fetchPartnerData = async (accessToken: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.partners.getDashboard(accessToken);
      const partnerData = res?.partnerInfo ? res : (res?.data || res);
      setData(partnerData);
      if (partnerData?.partnerInfo?.bankDetails) {
        setBankForm({
          accountNumber: "", // Keep blank so user only types if changing
          routingNumber: partnerData.partnerInfo.bankDetails.routingNumber || "",
          bankName: partnerData.partnerInfo.bankDetails.bankName || "",
          accountHolderName: partnerData.partnerInfo.bankDetails.accountHolderName || "",
        });
      }
    } catch (err: any) {
      setError(err?.message || "Invalid or expired partner link.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPartnerData(token);
    } else {
      setLoading(false);
      setError("No partner access token provided. Please use your personalized magic link.");
    }
  }, [token]);

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setBankSubmitting(true);
    setBankSuccess(false);
    setBankError(null);

    try {
      await api.partners.updateBankDetails(token, bankForm);
      setBankSuccess(true);
      setTimeout(() => setBankSuccess(false), 3500);
      await fetchPartnerData(token);
    } catch (err: any) {
      setBankError(err?.message || "Failed to update bank details.");
    } finally {
      setBankSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-[#155DFC]" />
          <p className="text-zinc-400 text-sm font-medium">Loading partner portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="bg-[#111111] border border-red-500/20 rounded-2xl p-8 max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const { partnerInfo, metrics, realtimeGraphData } = data;

  return (
    <div className="min-h-screen bg-black text-white font-inter">
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-[#111111]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#155DFC] flex items-center justify-center font-bold text-white shadow-lg shadow-[#155DFC]/20">
              CC
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">CultureCards LLC</h1>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Partner Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Referral Code:</span>
            <span className="font-mono font-bold text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg">
              {partnerInfo.promoCode}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-950/40 via-[#111111] to-black border border-white/10 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Welcome back, {partnerInfo.name}! 👋
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                Real-time performance analytics for users registered with your promo code <strong>{partnerInfo.promoCode}</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-4 py-2 rounded-xl text-xs">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span className="text-zinc-300">Private & Encrypted Dashboard</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Referred Users</span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mt-2">{metrics.totalReferredUsers}</p>
            <span className="text-[11px] text-zinc-500 mt-1 block">Live users onboarded</span>
          </div>

          <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Transactions</span>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mt-2">${metrics.totalTransactions.toFixed(2)}</p>
            <span className="text-[11px] text-zinc-500 mt-1 block">Gross user sales & trades</span>
          </div>

          <div className="bg-[#111111] border border-emerald-500/30 bg-emerald-500/[0.03] p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Your Share ({partnerInfo.revenueSharePercentage}%)</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-400 mt-2">${metrics.partnerShareTotal.toFixed(2)}</p>
            <span className="text-[11px] text-emerald-500/70 mt-1 block">Your accumulated earnings</span>
          </div>

          <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Platform Share ({100 - partnerInfo.revenueSharePercentage}%)</span>
              <div className="w-10 h-10 rounded-xl bg-zinc-500/10 text-zinc-400 flex items-center justify-center">
                <Handshake size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-zinc-300 mt-2">${metrics.ownerShareTotal.toFixed(2)}</p>
            <span className="text-[11px] text-zinc-500 mt-1 block">Platform fee share</span>
          </div>
        </div>

        {/* Real-time Side-by-Side Revenue Graph */}
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-[#155DFC]" />
              Revenue Split Comparison (50% / 50%)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comparison between your earnings and the platform revenue share over time.
            </p>
          </div>

          {realtimeGraphData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-zinc-500 text-sm border border-dashed border-white/5 rounded-xl">
              No transaction history recorded yet. Share your code <strong>{partnerInfo.promoCode}</strong> to start earning!
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={realtimeGraphData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "12px" }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, ""]}
                  />
                  <Legend />
                  <Bar dataKey="partnerEarnings" name="Your Earnings (50%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ownerEarnings" name="Platform Share (50%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payout & Banking Form */}
        <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Landmark size={18} className="text-emerald-400" />
                Direct Payout Banking Details
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Provide your bank details where weekly affiliate commissions should be transferred.
              </p>
            </div>
            {partnerInfo.bankDetails?.accountNumber && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <CheckCircle2 size={13} />
                Current: {partnerInfo.bankDetails.accountNumber}
              </span>
            )}
          </div>

          {bankSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Banking information updated securely!</span>
            </div>
          )}

          {bankError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{bankError}</span>
            </div>
          )}

          <form onSubmit={handleBankSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Account Holder Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Boobie Holdings LLC"
                value={bankForm.accountHolderName}
                onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Bank Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chase / Bank of America"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                US Routing Number (9 Digits)
              </label>
              <input
                type="text"
                required
                maxLength={9}
                placeholder="123456789"
                value={bankForm.routingNumber}
                onChange={(e) => setBankForm({ ...bankForm, routingNumber: e.target.value.replace(/\D/g, '') })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                required={!partnerInfo.bankDetails?.accountNumber}
                placeholder={partnerInfo.bankDetails?.accountNumber ? `Keep current (${partnerInfo.bankDetails.accountNumber})` : "Bank account number"}
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-[11px] text-zinc-500">
                🔒 Payouts are transferred automatically. No Social Security Number (SSN) required.
              </p>
              <button
                type="submit"
                disabled={bankSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {bankSubmitting ? "Saving..." : "Save Payout Details"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function PartnerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-[#155DFC]" />
        </div>
      }
    >
      <PartnerDashboardContent />
    </Suspense>
  );
}
