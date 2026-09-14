"use client";

import { useEffect, useState } from "react";
import {
  Handshake,
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  Users,
  DollarSign,
  Landmark,
  Download,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Mail,
  Eye,
  X,
  TrendingUp,
  BarChart3,
  LineChart,
  Activity,
  MoreVertical,
  User,
  Tag,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { api } from "@/app/lib/api";

interface Partner {
  _id: string;
  name: string;
  email: string;
  promoCode: string;
  revenueSharePercentage: number;
  totalReferredUsers: number;
  totalEarnings: number;
  accessToken: string;
  bankDetails?: {
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    accountHolderName?: string;
  };
  createdAt?: string;
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dropdown menu state per partner
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Bank Copy feedback state
  const [copiedBankInfo, setCopiedBankInfo] = useState(false);

  // Partner Details Modal State
  const [selectedPartnerDetails, setSelectedPartnerDetails] = useState<Partner | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [partnerDashboardData, setPartnerDashboardData] = useState<any>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState<"overview" | "bank" | "magic">("overview");
  const [chartType, setChartType] = useState<"bar" | "area">("area");

  // Email sending state
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    promoCode: "",
    revenueSharePercentage: 50,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await api.partners.getAll();
      const rawData = Array.isArray(res) ? res : (res?.data || []);
      setPartners(rawData);
    } catch (err: any) {
      console.error("Failed to load partners:", err);
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".partner-dropdown-container")) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleOpenDetails = async (partner: Partner) => {
    setSelectedPartnerDetails(partner);
    setPartnerDashboardData(null);
    setActiveDetailsTab("overview");
    setDetailsLoading(true);
    try {
      const res = await api.partners.getDashboard(partner.accessToken);
      const data = res?.data || res;
      setPartnerDashboardData(data);
    } catch (err: any) {
      console.error("Failed to load partner details dashboard:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCopyLink = (token: string, partnerId: string, partnerName: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const magicUrl = origin + "/partner/dashboard?token=" + token;
    navigator.clipboard.writeText(magicUrl);
    setCopiedId(partnerId);
    setCopiedNotification("Magic link for " + partnerName + " copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
    setTimeout(() => setCopiedNotification(null), 4000);
  };

  const handleSendEmail = async (partner: Partner) => {
    try {
      setSendingEmailId(partner._id);
      await api.partners.sendEmail(partner._id);
      setCopiedNotification("Magic link & promo code successfully emailed to " + partner.email + "!");
      setTimeout(() => setCopiedNotification(null), 4000);
    } catch (err: any) {
      alert("Failed to send email: " + (err?.message || "Unknown error"));
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleCopyFullBankInfo = (partner: Partner) => {
    if (!partner.bankDetails) return;
    const infoText = "Partner: " + partner.name + " (" + partner.email + ")\nBank Name: " + (partner.bankDetails.bankName || 'N/A') + "\nAccount Holder: " + (partner.bankDetails.accountHolderName || 'N/A') + "\nRouting Number: " + (partner.bankDetails.routingNumber || 'N/A') + "\nAccount Number: " + (partner.bankDetails.accountNumber || 'N/A');
    navigator.clipboard.writeText(infoText);
    setCopiedBankInfo(true);
    setTimeout(() => setCopiedBankInfo(false), 2500);
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await api.partners.create(formData);
      setIsModalOpen(false);
      const createdEmail = formData.email;
      const createdName = formData.name;
      setFormData({ name: "", email: "", promoCode: "", revenueSharePercentage: 50 });
      setCopiedNotification("Partner " + createdName + " created! Magic link emailed automatically to " + createdEmail + ".");
      setTimeout(() => setCopiedNotification(null), 5000);
      await fetchPartners();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || "Failed to create partner");
    } finally {
      setSubmitting(false);
    }
  };

  const exportToCSV = () => {
    if (!partners.length) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const headers = ["Name", "Email", "Promo Code", "Share %", "Referred Users", "Total Earnings ($)", "Bank Holder", "Bank Name", "Routing No", "Account No", "Magic Link"];
    const rows = partners.map(p => [
      '"' + p.name + '"',
      '"' + p.email + '"',
      '"' + p.promoCode + '"',
      p.revenueSharePercentage + '%',
      p.totalReferredUsers || 0,
      (p.totalEarnings || 0).toFixed(2),
      '"' + (p.bankDetails?.accountHolderName || '') + '"',
      '"' + (p.bankDetails?.bankName || '') + '"',
      '"' + (p.bankDetails?.routingNumber || '') + '"',
      '"' + (p.bankDetails?.accountNumber || '') + '"',
      '"' + origin + '/partner/dashboard?token=' + p.accessToken + '"'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "culturecards_partners_" + new Date().toISOString().slice(0, 10) + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.promoCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalReferredUsersAll = partners.reduce((sum, p) => sum + (p.totalReferredUsers || 0), 0);
  const totalPartnerEarningsAll = partners.reduce((sum, p) => sum + (p.totalEarnings || 0), 0);
  const activeBankCount = partners.filter(p => p.bankDetails?.accountNumber).length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {copiedNotification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Check size={16} />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Partner & Affiliate Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#155DFC]/10 text-[#155DFC] text-xs font-semibold border border-[#155DFC]/20 flex items-center gap-1">
              <Sparkles size={12} /> 50/50 Revenue Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage influencers, review partner metrics, send magic portal links, and view detailed analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPartners}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition-all border border-white/5"
            title="Refresh Partners"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={exportToCSV}
            disabled={!partners.length}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-semibold rounded-xl border border-white/10 transition-all disabled:opacity-40"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#155DFC] hover:bg-[#155DFC]/90 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-[#155DFC]/25 hover:shadow-[#155DFC]/40"
          >
            <Plus size={16} />
            Add New Partner
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-[#155DFC]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Partners</span>
            <div className="w-9 h-9 rounded-xl bg-[#155DFC]/10 text-[#155DFC] flex items-center justify-center">
              <Handshake size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{partners.length}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Active affiliate managers</span>
        </div>

        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Referred Collectors</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{totalReferredUsersAll}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Signed up with promo codes</span>
        </div>

        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Partner Earnings</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">${totalPartnerEarningsAll.toFixed(2)}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Accumulated 50% commission</span>
        </div>

        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Bank Accounts Set Up</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Landmark size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{activeBankCount} / {partners.length}</p>
          <span className="text-[11px] text-zinc-500 mt-1 block">Ready for automated payout</span>
        </div>
      </div>

      {/* Partner Table Section (Streamlined with Dropdown Actions) */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search partner by name, email, or promo code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#155DFC]"
            />
          </div>

          <div className="text-xs text-zinc-400 font-medium">
            Showing <span className="text-white font-bold">{filteredPartners.length}</span> of {partners.length} partners
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
            <RefreshCw size={20} className="animate-spin mr-2 text-[#155DFC]" /> Loading partners dataset...
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-500 text-sm border border-dashed border-white/5 rounded-xl space-y-2">
            <Handshake size={32} className="text-zinc-600 mb-1" />
            <p className="font-semibold text-zinc-300">No partners found</p>
            <p className="text-xs text-zinc-500">
              {searchQuery ? "Try resetting your search query filter." : "Click 'Add New Partner' to create your first partner."}
            </p>
          </div>
        ) : (
          <div className="overflow-visible">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Partner Info</th>
                  <th className="py-3 px-4">Promo Code</th>
                  <th className="py-3 px-4">Referred Users</th>
                  <th className="py-3 px-4">Total Earnings</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPartners.map((partner) => (
                  <tr key={partner._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-4">
                      <div
                        onClick={() => handleOpenDetails(partner)}
                        className="flex items-center gap-3 cursor-pointer group/item"
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#155DFC] to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-[#155DFC]/20 border border-white/10 group-hover/item:scale-105 transition-transform">
                          {getInitials(partner.name)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm group-hover/item:text-[#155DFC] transition-colors flex items-center gap-1.5">
                            <span>{partner.name}</span>
                            <Eye size={12} className="opacity-0 group-hover/item:opacity-100 text-[#155DFC] transition-opacity" />
                          </div>
                          <div className="text-xs text-zinc-400">{partner.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold text-xs">
                        {partner.promoCode}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-zinc-200 font-bold text-sm">
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-zinc-500" />
                        <span>{partner.totalReferredUsers || 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-emerald-400 font-extrabold text-sm">
                      ${(partner.totalEarnings || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right relative">
                      <div className="flex items-center justify-end gap-2 relative partner-dropdown-container">
                        {/* Primary View Details Button */}
                        <button
                          onClick={() => handleOpenDetails(partner)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#155DFC]/10 hover:bg-[#155DFC]/20 text-[#155DFC] border border-[#155DFC]/20 text-xs font-semibold transition-all hover:scale-105"
                          title="View Partner Details & Analytics"
                        >
                          <Eye size={14} />
                          <span>Details</span>
                        </button>

                        {/* Dropdown Menu Trigger Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(activeDropdownId === partner._id ? null : partner._id);
                          }}
                          className={"p-1.5 rounded-xl text-zinc-400 hover:text-white border transition-all " + (
                            activeDropdownId === partner._id
                              ? "bg-white/10 border-white/20 text-white shadow-lg"
                              : "bg-white/5 hover:bg-white/10 border-white/10"
                          )}
                          title="More Actions"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {/* Floating Glassmorphic Dropdown Menu */}
                        {activeDropdownId === partner._id && (
                          <div className="absolute right-0 top-full mt-2 w-52 bg-[#161618] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 text-left backdrop-blur-xl">
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleOpenDetails(partner);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
                            >
                              <Eye size={14} className="text-[#155DFC]" />
                              <span>View Full Details</span>
                            </button>

                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleSendEmail(partner);
                              }}
                              disabled={sendingEmailId === partner._id}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-600/20 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <Mail size={14} className={sendingEmailId === partner._id ? "animate-bounce" : ""} />
                              <span>{sendingEmailId === partner._id ? "Sending Email..." : "Send Access Email"}</span>
                            </button>

                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleCopyLink(partner.accessToken, partner._id, partner.name);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
                            >
                              {copiedId === partner._id ? (
                                <>
                                  <Check size={14} className="text-emerald-400" />
                                  <span className="text-emerald-400">Link Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} className="text-zinc-400" />
                                  <span>Copy Magic Link</span>
                                </>
                              )}
                            </button>

                            <div className="border-t border-white/10 my-1" />

                            <a
                              href={"/partner/dashboard?token=" + partner.accessToken}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setActiveDropdownId(null)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
                            >
                              <ExternalLink size={14} className="text-zinc-400" />
                              <span>Open Live Portal</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULL PARTNER DETAILS MODAL */}
      {selectedPartnerDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#155DFC] to-purple-600 text-white font-extrabold text-lg flex items-center justify-center shadow-lg shadow-[#155DFC]/30 border border-white/20">
                  {getInitials(selectedPartnerDetails.name)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedPartnerDetails.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono font-bold text-xs border border-blue-500/20">
                      Code: {selectedPartnerDetails.promoCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-xs border border-emerald-500/20">
                      {selectedPartnerDetails.revenueSharePercentage}% Revenue Share
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{selectedPartnerDetails.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={"/partner/dashboard?token=" + selectedPartnerDetails.accessToken}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold rounded-xl border border-white/10 transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Open Live Portal</span>
                </a>
                <button
                  onClick={() => setSelectedPartnerDetails(null)}
                  className="text-zinc-400 hover:text-white transition-colors w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <button
                onClick={() => setActiveDetailsTab("overview")}
                className={"flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all " + (
                  activeDetailsTab === "overview"
                    ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/25"
                    : "bg-white/5 text-zinc-400 hover:text-white"
                )}
              >
                <Activity size={14} />
                <span>Overview & Analytics</span>
              </button>
              <button
                onClick={() => setActiveDetailsTab("bank")}
                className={"flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all " + (
                  activeDetailsTab === "bank"
                    ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/25"
                    : "bg-white/5 text-zinc-400 hover:text-white"
                )}
              >
                <Landmark size={14} />
                <span>Bank Payout Details</span>
              </button>
              <button
                onClick={() => setActiveDetailsTab("magic")}
                className={"flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all " + (
                  activeDetailsTab === "magic"
                    ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/25"
                    : "bg-white/5 text-zinc-400 hover:text-white"
                )}
              >
                <Mail size={14} />
                <span>Magic Access & Email</span>
              </button>
            </div>

            {/* Modal Tab Content */}
            {detailsLoading ? (
              <div className="h-64 flex items-center justify-center text-zinc-400 text-xs">
                <RefreshCw size={20} className="animate-spin mr-2 text-[#155DFC]" /> Loading partner metrics & graph...
              </div>
            ) : (
              <>
                {/* TAB 1: OVERVIEW & ANALYTICS */}
                {activeDetailsTab === "overview" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-black/50 border border-white/10 p-4 rounded-xl">
                        <span className="text-[11px] text-zinc-400 font-medium block">Partner Net Earnings</span>
                        <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                          ${partnerDashboardData?.metrics?.partnerShareTotal?.toFixed(2) || (selectedPartnerDetails.totalEarnings || 0).toFixed(2)}
                        </p>
                        <span className="text-[10px] text-zinc-500">{selectedPartnerDetails.revenueSharePercentage}% Commission Split</span>
                      </div>

                      <div className="bg-black/50 border border-white/10 p-4 rounded-xl">
                        <span className="text-[11px] text-zinc-400 font-medium block">Platform Share</span>
                        <p className="text-2xl font-extrabold text-blue-400 mt-1">
                          ${partnerDashboardData?.metrics?.ownerShareTotal?.toFixed(2) || "0.00"}
                        </p>
                        <span className="text-[10px] text-zinc-500">{100 - selectedPartnerDetails.revenueSharePercentage}% CultureCards Retention</span>
                      </div>

                      <div className="bg-black/50 border border-white/10 p-4 rounded-xl">
                        <span className="text-[11px] text-zinc-400 font-medium block">Total Sales/Trade Volume</span>
                        <p className="text-2xl font-extrabold text-white mt-1">
                          ${partnerDashboardData?.metrics?.totalTransactions?.toFixed(2) || "0.00"}
                        </p>
                        <span className="text-[10px] text-zinc-500">Gross Referred Marketplace Activity</span>
                      </div>

                      <div className="bg-black/50 border border-white/10 p-4 rounded-xl">
                        <span className="text-[11px] text-zinc-400 font-medium block">Referred Collectors</span>
                        <p className="text-2xl font-extrabold text-purple-400 mt-1">
                          {partnerDashboardData?.metrics?.totalReferredUsers ?? selectedPartnerDetails.totalReferredUsers ?? 0}
                        </p>
                        <span className="text-[10px] text-zinc-500">Linked by code {selectedPartnerDetails.promoCode}</span>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-400" />
                            Live Earnings & Platform Revenue Breakdown
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Daily performance history of partner commission vs platform share
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10">
                          <button
                            onClick={() => setChartType("area")}
                            className={"flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all " + (
                              chartType === "area" ? "bg-[#155DFC] text-white" : "text-zinc-400 hover:text-white"
                            )}
                          >
                            <LineChart size={12} />
                            Area
                          </button>
                          <button
                            onClick={() => setChartType("bar")}
                            className={"flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all " + (
                              chartType === "bar" ? "bg-[#155DFC] text-white" : "text-zinc-400 hover:text-white"
                            )}
                          >
                            <BarChart3 size={12} />
                            Bar
                          </button>
                        </div>
                      </div>

                      {!partnerDashboardData?.realtimeGraphData || partnerDashboardData.realtimeGraphData.length === 0 ? (
                        <div className="h-56 flex flex-col items-center justify-center text-zinc-500 text-xs border border-dashed border-white/10 rounded-xl space-y-1">
                          <Activity size={24} className="text-zinc-600 mb-1" />
                          <p className="font-semibold text-zinc-400">No time-series transaction activity recorded yet</p>
                          <p className="text-[11px] text-zinc-600">Earnings will plot automatically when referred collectors transact.</p>
                        </div>
                      ) : (
                        <div className="h-64 w-full pt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            {chartType === "bar" ? (
                              <BarChart data={partnerDashboardData.realtimeGraphData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                <defs>
                                  <linearGradient id="detailBarPartner" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                                  </linearGradient>
                                  <linearGradient id="detailBarOwner" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(v) => "$" + v} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: "#141414", border: "1px solid #333", borderRadius: "12px" }}
                                  formatter={(val: any, name: any) => ["$" + Number(val).toFixed(2), name]}
                                />
                                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                                <Bar dataKey="partnerEarnings" name={"Partner Share (" + selectedPartnerDetails.revenueSharePercentage + "%)"} fill="url(#detailBarPartner)" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="ownerEarnings" name={"Platform Share (" + (100 - selectedPartnerDetails.revenueSharePercentage) + "%)"} fill="url(#detailBarOwner)" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            ) : (
                              <AreaChart data={partnerDashboardData.realtimeGraphData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                <defs>
                                  <linearGradient id="detailColorPartner" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                  </linearGradient>
                                  <linearGradient id="detailColorOwner" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(v) => "$" + v} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: "#141414", border: "1px solid #333", borderRadius: "12px" }}
                                  formatter={(val: any, name: any) => ["$" + Number(val).toFixed(2), name]}
                                />
                                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                                <Area type="monotone" dataKey="partnerEarnings" name={"Partner Share (" + selectedPartnerDetails.revenueSharePercentage + "%)"} stroke="#10b981" fill="url(#detailColorPartner)" strokeWidth={2} />
                                <Area type="monotone" dataKey="ownerEarnings" name={"Platform Share (" + (100 - selectedPartnerDetails.revenueSharePercentage) + "%)"} stroke="#3b82f6" fill="url(#detailColorOwner)" strokeWidth={2} />
                              </AreaChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: BANK PAYOUT DETAILS */}
                {activeDetailsTab === "bank" && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                            <Landmark size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">Bank Payout Configuration</h3>
                            <p className="text-[11px] text-zinc-400">Direct deposit info provided by partner</p>
                          </div>
                        </div>

                        {selectedPartnerDetails.bankDetails?.accountNumber ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                            Active Setup
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
                            Pending Partner Setup
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                        <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-1">
                          <span className="text-zinc-500 text-[10px] uppercase font-bold block">Account Holder Name</span>
                          <span className="text-white font-bold text-sm">
                            {selectedPartnerDetails.bankDetails?.accountHolderName || "Not configured"}
                          </span>
                        </div>

                        <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-1">
                          <span className="text-zinc-500 text-[10px] uppercase font-bold block">Bank Name</span>
                          <span className="text-white font-bold text-sm">
                            {selectedPartnerDetails.bankDetails?.bankName || "Not configured"}
                          </span>
                        </div>

                        <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-1">
                          <span className="text-zinc-500 text-[10px] uppercase font-bold block">Routing Number</span>
                          <span className="text-emerald-400 font-bold text-sm">
                            {selectedPartnerDetails.bankDetails?.routingNumber || "Not configured"}
                          </span>
                        </div>

                        <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-1">
                          <span className="text-zinc-500 text-[10px] uppercase font-bold block">Account Number</span>
                          <span className="text-emerald-400 font-bold text-sm">
                            {selectedPartnerDetails.bankDetails?.accountNumber || "Not configured"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-zinc-500">
                          🔒 Security Masking applied to full account numbers for privacy compliance.
                        </span>
                        <button
                          onClick={() => handleCopyFullBankInfo(selectedPartnerDetails)}
                          disabled={!selectedPartnerDetails.bankDetails?.accountNumber}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-40"
                        >
                          {copiedBankInfo ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedBankInfo ? "Copied Info!" : "Copy Bank Details"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: MAGIC ACCESS & EMAIL */}
                {activeDetailsTab === "magic" && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-6 space-y-5">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                          <Mail size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Magic Access Link & Promo Settings</h3>
                          <p className="text-[11px] text-zinc-400">Manage partner referral code and magic authentication link</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                            Exclusive Promo Code
                          </label>
                          <div className="flex items-center gap-3">
                            <span className="px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-extrabold text-sm rounded-xl tracking-wider">
                              {selectedPartnerDetails.promoCode}
                            </span>
                            <span className="text-xs text-zinc-400">
                              Collectors enter this code to give partner {selectedPartnerDetails.revenueSharePercentage}% earnings
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                            Standalone Magic Portal Link
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={(typeof window !== "undefined" ? window.location.origin : "") + "/partner/dashboard?token=" + selectedPartnerDetails.accessToken}
                              className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 font-mono select-all focus:outline-none"
                            />
                            <button
                              onClick={() => handleCopyLink(selectedPartnerDetails.accessToken, selectedPartnerDetails._id, selectedPartnerDetails.name)}
                              className="px-4 py-2.5 bg-[#155DFC] hover:bg-[#155DFC]/90 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                            >
                              <Copy size={14} />
                              <span>Copy Link</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 pt-4">
                        <span className="text-xs text-zinc-400">
                          Resend magic link email directly to <strong className="text-white">{selectedPartnerDetails.email}</strong>
                        </span>
                        <button
                          onClick={() => handleSendEmail(selectedPartnerDetails)}
                          disabled={sendingEmailId === selectedPartnerDetails._id}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                        >
                          <Mail size={14} className={sendingEmailId === selectedPartnerDetails._id ? "animate-bounce" : ""} />
                          <span>{sendingEmailId === selectedPartnerDetails._id ? "Sending Email..." : "Resend Access Email"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Add Partner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Handshake size={20} className="text-[#155DFC]" />
                  Add Partner Influencer
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Creates partner portal & sends magic login link via email
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors text-sm w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <ShieldCheck size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-zinc-400" />
                  <span>Partner Name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Md. Mohosin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#155DFC] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-zinc-400" />
                  <span>Partner Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="partner@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#155DFC] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag size={13} className="text-zinc-400" />
                    <span>Promo / Referral Code</span>
                  </span>
                  {formData.promoCode && (
                    <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      CODE: {formData.promoCode}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OG"
                  value={formData.promoCode}
                  onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase().replace(/\s+/g, "") })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase text-white placeholder-zinc-500 focus:outline-none focus:border-[#155DFC] transition-colors tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Percent size={13} className="text-zinc-400" />
                    <span>Partner Revenue Share Percentage</span>
                  </span>
                  <span className="text-[#155DFC] font-bold text-xs">
                    {formData.revenueSharePercentage}% Partner / {100 - formData.revenueSharePercentage}% Platform
                  </span>
                </label>
                
                {/* Selectable Revenue Share Preset Buttons */}
                <div className="flex items-center gap-2">
                  {[30, 50, 70].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setFormData({ ...formData, revenueSharePercentage: pct })}
                      className={"flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 " + (
                        formData.revenueSharePercentage === pct
                          ? "bg-[#155DFC] text-white border-[#155DFC] shadow-lg shadow-[#155DFC]/25 ring-2 ring-[#155DFC]/40"
                          : "bg-black/50 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <span>{pct}%</span>
                      <span className="text-[10px] opacity-70 font-normal">/ {100 - pct}%</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-start gap-2">
                <Sparkles size={14} className="shrink-0 mt-0.5 text-blue-400" />
                <span>
                  Creating partner instantly sends a magic login link & promo code to <strong className="text-white">{formData.email || "partner email"}</strong>.
                </span>
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
                  className="px-5 py-2.5 bg-[#155DFC] hover:bg-[#155DFC]/90 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-[#155DFC]/20 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Creating & Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={14} />
                      <span>Create & Send Magic Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
