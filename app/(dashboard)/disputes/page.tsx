"use client";

import React, { useState, useEffect } from "react";
import { 
  Eye, 
  MessageSquare, 
  Check, 
  X, 
  FileImage, 
  FileText,
  Clock,
  Loader2,
  Search,
  Filter,
  ShieldAlert,
  FolderLock,
  UserCheck
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchDisputes, resolveDispute, rejectDispute, DisputeItem } from "@/app/store/slices/disputesSlice";
import { useAlert } from "@/app/context/AlertContext";
import { api } from "@/app/lib/api";
import ErrorState from "@/app/components/ErrorState";
import Pagination from "@/app/components/Pagination";

export default function DisputesPage() {
  const dispatch = useAppDispatch();
  const { items: disputes, loading } = useAppSelector((state) => state.disputes);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const { showAlert, showConfirm, showPrompt } = useAlert();
  const [activeChatDispute, setActiveChatDispute] = useState<DisputeItem | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ senderId: string; senderName: string; text: string; time: string; color: string }>>([]);
  const [newMessage, setNewMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const filteredDisputes = disputes.filter((dispute: DisputeItem) => {
    const userNames = dispute.users?.map((u: any) => u.name).join(" ") || "";
    const matchesSearch =
      dispute.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userNames.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.targetId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.issueType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || dispute.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === "All" || dispute.priority?.toLowerCase() === priorityFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, priorityFilter]);

  const totalPages = Math.ceil(filteredDisputes.length / rowsPerPage);
  const paginatedDisputes = filteredDisputes.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    dispatch(fetchDisputes());
  }, [dispatch]);

  // Calculate dynamic stats
  const totalCount = disputes.length;
  const pendingCount = disputes.filter((d) => d.status === "Open" || d.status === "Reviewing").length;
  const resolvedCount = disputes.filter((d) => d.status === "Resolved").length;
  const highPriorityCount = disputes.filter((d) => d.priority === "High").length;

  const stats = [
    {
      name: "Total Disputes Filed",
      value: totalCount.toLocaleString(),
      icon: FolderLock,
      color: "text-blue-400 border-blue-500/20",
      bgGrad: "from-blue-500/10 to-indigo-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    },
    {
      name: "Pending Review",
      value: pendingCount.toLocaleString(),
      icon: Clock,
      color: "text-amber-400 border-amber-500/20",
      bgGrad: "from-amber-500/10 to-orange-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    },
    {
      name: "Resolved Cases",
      value: resolvedCount.toLocaleString(),
      icon: UserCheck,
      color: "text-emerald-400 border-emerald-500/20",
      bgGrad: "from-emerald-500/10 to-teal-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    },
    {
      name: "High Priority Cases",
      value: highPriorityCount.toLocaleString(),
      icon: ShieldAlert,
      color: "text-red-400 border-red-500/20",
      bgGrad: "from-red-500/10 to-pink-500/5",
      glow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]",
    },
  ];

  useEffect(() => {
    if (!activeChatDispute) {
      setActiveChatId(null);
      setChatMessages([]);
      return;
    }

    let isInitialLoad = true;

    const loadChat = async () => {
      if (isInitialLoad) setChatLoading(true);
      try {
        const res = await api.dashboard.getDisputeChat(activeChatDispute.id);
        setActiveChatId(res.chatId);
        
        // Decode admin ID from JWT payload
        const token = localStorage.getItem("admin_access_token");
        let adminId = "";
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            adminId = payload.userId || payload.id || "";
          } catch {}
        }

        const reporterName = activeChatDispute.users?.[0]?.name || "Buyer";
        const reportedName = activeChatDispute.users?.[1]?.name || "Seller";

        const mapped = res.messages.map((m: any) => {
          let color = "text-zinc-500 bg-zinc-800/20 border-zinc-700/20";
          if (m.senderId === adminId) {
            color = "text-white bg-[#155DFC]/20 border-[#155DFC]/30";
          } else if (m.senderName === reportedName) {
            color = "text-teal-400 bg-teal-500/10 border-teal-500/20";
          } else if (m.senderName === reporterName) {
            color = "text-blue-400 bg-blue-500/10 border-blue-500/20";
          }

          return {
            senderId: m.senderId,
            senderName: m.senderId === adminId ? "Moderator (You)" : m.senderName,
            text: m.text,
            time: m.time,
            color,
          };
        });

        // Add starting system alert if there are no messages yet
        if (mapped.length === 0) {
          mapped.push({
            senderId: "system",
            senderName: "System Alert",
            text: `Moderator joined the conversation. Chat logs are being recorded for dispute resolution.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            color: "text-zinc-500 bg-zinc-800/20 border-zinc-700/20"
          });
        }

        setChatMessages(mapped);
      } catch (err: any) {
        if (isInitialLoad) {
          showAlert(err?.message || "Failed to load dispute chat room.", "error");
        }
      } finally {
        if (isInitialLoad) {
          setChatLoading(false);
          isInitialLoad = false;
        }
      }
    };

    loadChat();

    // Poll for new messages every 5 seconds (silently, no spinner)
    const interval = setInterval(loadChat, 5000);
    return () => {
      clearInterval(interval);
      isInitialLoad = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatDispute]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;

    const messageText = newMessage;
    setNewMessage("");

    try {
      await api.messages.send(activeChatId, messageText);
      
      // Append immediately to state for zero-latency responsive feel
      setChatMessages(prev => [
        ...prev,
        {
          senderId: "me", // will match adminId on reload
          senderName: "Moderator (You)",
          text: messageText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          color: "text-white bg-[#155DFC]/20 border-[#155DFC]/30"
        }
      ]);
    } catch (err: any) {
      showAlert(err?.message || "Failed to send message.", "error");
    }
  };

  const handleResolve = async (disputeId: string) => {
    showConfirm(
      `Are you sure you want to mark dispute ${disputeId} as resolved?`,
      async () => {
        try {
          await dispatch(resolveDispute(disputeId)).unwrap();
          showAlert("Dispute resolved successfully.", "success");
        } catch (err: any) {
          showAlert(err?.message || "Failed to resolve dispute.", "error");
        }
      },
      "Resolve Dispute"
    );
  };

  const handleReject = async (disputeId: string) => {
    showPrompt(
      "Reject Dispute",
      "Enter reason for rejection",
      async (reason) => {
        try {
          await dispatch(rejectDispute({ 
            id: disputeId, 
            reason: reason || "Dispute rejected by moderator" 
          })).unwrap();
          showAlert("Dispute rejected successfully.", "success");
        } catch (err: any) {
          showAlert(err?.message || "Failed to reject dispute.", "error");
        }
      },
      "Dispute rejected by moderator"
    );
  };

  const { error } = useAppSelector((state) => state.disputes);

  if (loading && disputes.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#155DFC]" size={40} />
      </div>
    );
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchDisputes())} />;
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Dispute Management
            {loading && <Loader2 className="animate-spin text-[#155DFC]" size={20} />}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Review user-reported cases, audit transaction trade evidence, and moderate chat support channels.
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

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search disputes by ID, user, target, description..."
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
              isFilterOpen || statusFilter !== "All" || priorityFilter !== "All"
                ? "border-[#155DFC] text-white"
                : "border-white/5"
            }`}
          >
            <Filter size={18} />
            <span className="font-medium">Filter</span>
            {(statusFilter !== "All" || priorityFilter !== "All") && (
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
                      setPriorityFilter("All");
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
                    {["All", "Open", "Reviewing", "Resolved", "Rejected"].map((status) => (
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

                {/* Priority Filter Pills */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Priority</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "High", "Medium", "Low"].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => setPriorityFilter(priority)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          priorityFilter.toLowerCase() === priority.toLowerCase()
                            ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/20"
                            : "bg-black/40 text-zinc-400 hover:text-white border border-white/5"
                        }`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Disputes Cards List */}
      <div className="space-y-6">
        {filteredDisputes.length === 0 ? (
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500">
              <Clock size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-200">No Disputes Found</h3>
              <p className="text-sm text-zinc-500 max-w-sm">
                There are currently no active disputes or support tickets matching your filters.
              </p>
            </div>
          </div>
        ) : (
          <>
            {paginatedDisputes.map((dispute: DisputeItem) => (
              <div key={dispute.id} className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-6 hover:border-white/10 transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white tracking-tight">{dispute.id}</h2>
                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      dispute.status === 'Open' || dispute.status === 'Reviewing'
                        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        : dispute.status === 'Resolved'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {dispute.status}
                    </span>
                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      dispute.priority === 'High' 
                        ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                        : dispute.priority === 'Medium' 
                        ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                        : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                      {dispute.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-500 text-xs font-semibold">
                    <Clock size={12} />
                    <span>Opened on {dispute.date}</span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Users Involved:</p>
                    <div className="flex gap-4">
                      {dispute.users?.map((user: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${user.color || 'bg-blue-500'} flex items-center justify-center text-[10px] font-bold text-white`}>
                            {user.initial || user.name?.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-zinc-300">{user.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500 text-xs font-semibold">Order/Trade ID:</span>
                      <span className="text-zinc-200 font-mono font-bold">{dispute.targetId}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500 text-xs font-semibold">Issue Type:</span>
                      <span className="text-zinc-200 font-semibold">{dispute.issueType}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Description:</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{dispute.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setSelectedDispute(dispute)}
                      className="flex items-center gap-2 bg-[#155DFC] hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <Eye size={18} />
                      View Evidence
                    </button>
                    <button
                      onClick={() => setActiveChatDispute(dispute)}
                      className="flex items-center gap-2 bg-black/40 hover:bg-[#155DFC]/20 border border-white/5 hover:border-[#155DFC]/30 text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
                    >
                      <MessageSquare size={18} />
                      Chat with Users
                    </button>
                  </div>
                  {dispute.status !== "Resolved" && dispute.status !== "Rejected" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleResolve(dispute.id)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-600/10 cursor-pointer"
                      >
                        <Check size={18} />
                        Resolve
                      </button>
                      <button
                        onClick={() => handleReject(dispute.id)}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-600/10 cursor-pointer"
                      >
                        <X size={18} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={setRowsPerPage}
              totalItems={filteredDisputes.length}
              itemNamePlural="disputes"
            />
          </>
        )}
      </div>

      {/* Evidence Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedDispute(null)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-xl bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedDispute.id} - Evidence</h2>
                  <p className="text-sm text-zinc-500 mt-1">{selectedDispute.issueType}</p>
                </div>
                <button 
                  onClick={() => setSelectedDispute(null)}
                  className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description:</p>
                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-sm text-zinc-300 leading-relaxed">
                    {selectedDispute.description}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Submitted Evidence:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-4 bg-black/40 border border-white/5 rounded-2xl text-zinc-300 hover:border-white/10 transition-colors cursor-pointer group">
                      <FileImage size={20} className="text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Photo evidence (3 images)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-black/40 border border-white/5 rounded-2xl text-zinc-300 hover:border-white/10 transition-colors cursor-pointer group">
                      <FileText size={20} className="text-zinc-500" />
                      <div>
                        <p className="text-sm font-medium">Communication logs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Moderator Chat Modal */}
      {activeChatDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setActiveChatDispute(null)}
          />

          <div className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-[550px]">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div>
                <h3 className="text-lg font-bold text-white">Dispute Moderator Chat</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Dispute ID: {activeChatDispute.id}</p>
              </div>
              <button 
                onClick={() => setActiveChatDispute(null)}
                className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatLoading && chatMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="animate-spin text-[#155DFC]" size={30} />
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex flex-col ${msg.senderName.startsWith("Moderator") ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{msg.senderName}</span>
                      <span className="text-[9px] text-zinc-600">{msg.time}</span>
                    </div>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl border text-sm leading-relaxed ${msg.color}`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-black/20 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type system alert or moderator message..."
                className="flex-1 bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-[#155DFC]"
              />
              <button
                type="submit"
                className="bg-[#155DFC] hover:bg-[#004ade] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
