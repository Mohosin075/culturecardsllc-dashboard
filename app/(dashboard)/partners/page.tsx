"use client";

import React, { useState, useEffect } from "react";
import {
  Handshake,
  Users,
  DollarSign,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Search,
  Percent,
  Landmark,
  Loader2,
} from "lucide-react";
import { api } from "@/app/lib/api";

interface Partner {
  _id: string;
  name: string;
  email: string;
  promoCode: string;
  revenueSharePercentage: number;
  totalEarnings: number;
  totalReferredUsers: number;
  accessToken: string;
  bankDetails?: {
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    accountHolderName?: string;
  };
  createdAt: string;
}

export default function PartnersAdminPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    promoCode: "",
    revenueSharePercentage: 50,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.partners.getAll();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setPartners(list);
    } catch (err: any) {
      setError(err?.message || "Failed to load partners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCopyLink = (token: string, id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const magicUrl = `${origin}/partner/dashboard?token=${token}`;
    navigator.clipboard.writeText(magicUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await api.partners.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        promoCode: formData.promoCode.trim().toUpperCase(),
        revenueSharePercentage: Number(formData.revenueSharePercentage) || 50,
      });

      setIsModalOpen(false);
      setFormData({ name: "", email: "", promoCode: "", revenueSharePercentage: 50 });
      await fetchPartners();
    } catch (err: any) {
      setFormError(err?.message || "Failed to create partner.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.promoCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReferredUsers = partners.reduce((sum, p) => sum + (p.totalReferredUsers || 0), 0);
  const totalPartnerEarnings = partners.reduce((sum, p) => sum + (p.totalEarnings || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Handshake className="text-[#155DFC]" size={28} />
            Partners & Affiliates
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage creator promo codes, 50/50 revenue splits, and private analytics links.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#155DFC] hover:bg-[#155DFC]/90 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-[#155DFC]/20"
        >
          <Plus size={18} />
          Add New Partner
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Partners</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Handshake size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{partners.length}</p>
        </div>

        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Referred Users</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalReferredUsers}</p>
        </div>

        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Partner Earnings Paid</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">${totalPartnerEarnings.toFixed(2)}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 bg-[#111111] border border-white/5 px-4 py-2.5 rounded-xl">
        <Search size={18} className="text-zinc-400" />
        <input
          type="text"
          placeholder="Search by partner name, email, or promo code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none w-full"
        />
      </div>

      {/* Partners Table */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-400 gap-3">
            <Loader2 size={24} className="animate-spin text-[#155DFC]" />
            <span>Loading partners...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : filteredPartners.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            No partners found. Click &quot;Add New Partner&quot; to onboard your first partner.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-zinc-400 uppercase text-[11px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Partner</th>
                  <th className="py-3.5 px-4 font-semibold">Promo Code</th>
                  <th className="py-3.5 px-4 font-semibold">Revenue Split</th>
                  <th className="py-3.5 px-4 font-semibold">Referred Users</th>
                  <th className="py-3.5 px-4 font-semibold">Earnings</th>
                  <th className="py-3.5 px-4 font-semibold">Bank Details</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPartners.map((partner) => (
                  <tr key={partner._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">{partner.name}</div>
                      <div className="text-xs text-zinc-400">{partner.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold text-xs">
                        {partner.promoCode}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-zinc-300 font-medium">
                      {partner.revenueSharePercentage}% / {100 - partner.revenueSharePercentage}%
                    </td>
                    <td className="py-4 px-4 text-zinc-300 font-semibold">
                      {partner.totalReferredUsers}
                    </td>
                    <td className="py-4 px-4 text-emerald-400 font-bold">
                      ${(partner.totalEarnings || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-xs text-zinc-400">
                      {partner.bankDetails?.accountNumber ? (
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Landmark size={14} className="text-emerald-400" />
                          <span>{partner.bankDetails.accountNumber}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600">Pending setup</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopyLink(partner.accessToken, partner._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors"
                          title="Copy Private Magic Link"
                        >
                          {copiedId === partner._id ? (
                            <>
                              <Check size={14} className="text-green-400" />
                              <span className="text-green-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                        <a
                          href={`/partner/dashboard?token=${partner.accessToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                          title="Open Partner Dashboard"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Partner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Handshake size={20} className="text-[#155DFC]" />
                Add New Partner
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Partner Name (e.g. Boobie)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter partner name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#155DFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Partner Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="partner@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#155DFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Promo / Referral Code (e.g. OG)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OG"
                  value={formData.promoCode}
                  onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase() })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm font-mono uppercase text-white focus:outline-none focus:border-[#155DFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center justify-between">
                  <span>Partner Revenue Share</span>
                  <span className="text-[#155DFC] font-bold">{formData.revenueSharePercentage}%</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.revenueSharePercentage}
                  onChange={(e) => setFormData({ ...formData, revenueSharePercentage: Number(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#155DFC]"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Default is 50%. (50% to Partner, 50% to Platform).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#155DFC] hover:bg-[#155DFC]/90 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Partner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
