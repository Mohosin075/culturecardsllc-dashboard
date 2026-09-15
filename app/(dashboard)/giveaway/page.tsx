"use client";

import React, { useState, useEffect } from "react";
import {
  Gift,
  Trophy,
  Users,
  Calendar,
  Sparkles,
  RefreshCw,
  Search,
  Settings,
  Flame,
  Award,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import {
  fetchGiveawayConfig,
  updateGiveawayConfig,
  fetchGiveawayParticipants,
  fetchRandomPool,
  fetchGiveawayWinners,
  drawGiveawayWinner,
  GiveawayParticipant,
} from "@/app/store/slices/giveawaySlice";
import { useAlert } from "@/app/context/AlertContext";

export default function GiveawayPage() {
  const dispatch = useAppDispatch();
  const {
    config,
    participants,
    pagination,
    randomPool,
    winners,
    loading,
    poolLoading,
    drawing,
  } = useAppSelector((state) => state.giveaway);
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<"wheel" | "participants" | "winners" | "settings">("wheel");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Wheel state
  const [selectedWinner, setSelectedWinner] = useState<GiveawayParticipant | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Config Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [drawDate, setDrawDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    dispatch(fetchGiveawayConfig());
    dispatch(fetchGiveawayParticipants({ page: 1, limit: 20 }));
    dispatch(fetchRandomPool(100));
    dispatch(fetchGiveawayWinners());
  }, [dispatch]);

  useEffect(() => {
    if (config) {
      setTitle(config.title || "Michael Vick Autographed Jersey Giveaway");
      setDescription(config.description || "Enter for a chance to win an authentic autographed Michael Vick Jersey!");
      setBannerUrl(config.bannerUrl || "");
      setDrawDate(config.drawDate || "2026-09-25");
      setIsActive(config.isActive ?? true);
    }
  }, [config]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    dispatch(fetchGiveawayParticipants({ page: 1, limit: 20, search }));
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    dispatch(fetchGiveawayParticipants({ page: newPage, limit: 20, search }));
  };

  const handleRefreshPool = () => {
    dispatch(fetchRandomPool(100));
    showAlert("Random pool of 100 participants refreshed!", "success");
  };

  const handleSpinClick = () => {
    if (spinning) return;
    if (randomPool.length === 0) {
      showAlert("No participants available in pool to spin!", "error");
      return;
    }

    const randomIndex = Math.floor(Math.random() * Math.min(randomPool.length, 20));
    setSpinning(true);

    const slices = Math.min(randomPool.length, 20);
    const sliceAngle = 360 / slices;
    const targetAngle = rotation + 360 * 6 + (360 - randomIndex * sliceAngle - sliceAngle / 2);

    setRotation(targetAngle);

    setTimeout(() => {
      setSpinning(false);
      const winner = randomPool[randomIndex];
      setSelectedWinner(winner);
      setShowWinnerModal(true);
    }, 4500);
  };

  const handleConfirmWinner = async () => {
    if (!selectedWinner) return;

    try {
      await dispatch(
        drawGiveawayWinner({
          userId: selectedWinner.userId || selectedWinner.id,
          prizeName: "Michael Vick Autographed Jersey",
          notes: "Selected via Admin Wheel Spin",
        })
      ).unwrap();

      showAlert(`🎉 ${selectedWinner.name} has been confirmed as the official winner!`, "success");
      setShowWinnerModal(false);
      dispatch(fetchGiveawayWinners());
    } catch (err: any) {
      showAlert(err?.message || "Failed to confirm winner", "error");
    }
  };

  const handleUpdateConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(
        updateGiveawayConfig({
          title,
          description,
          bannerUrl,
          drawDate,
          isActive,
        })
      ).unwrap();
      showAlert("Giveaway configuration updated successfully!", "success");
    } catch (err: any) {
      showAlert(err?.message || "Failed to update giveaway configuration", "error");
    }
  };

  const displayPool = randomPool.slice(0, 20);
  const totalSlices = displayPool.length || 1;
  const colors = [
    "#155DFC", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6",
    "#06B6D4", "#EF4444", "#3B82F6", "#14B8A6", "#6366F1"
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Giveaway Management</h1>
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${
              isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              {isActive ? "LIVE / ACTIVE" : "INACTIVE"}
            </span>
          </div>
          <p className="text-zinc-400 text-sm mt-1">
            Michael Vick Autographed Jersey Giveaway — Random Fair Selection & Participant Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              dispatch(fetchGiveawayConfig());
              dispatch(fetchGiveawayParticipants({ page, search }));
              dispatch(fetchGiveawayWinners());
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-black/40 hover:bg-white/5 border border-white/10 rounded-xl text-zinc-300 hover:text-white transition-all text-sm font-semibold cursor-pointer"
          >
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Entrants</p>
            <h3 className="text-2xl font-bold text-white mt-1">{pagination.total || participants.length || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Draw Date</p>
            <h3 className="text-xl font-bold text-white mt-1">{drawDate || "Sept 25, 2026"}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Current Prize</p>
            <h3 className="text-sm font-bold text-white mt-1 truncate max-w-[150px]">Michael Vick Jersey</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Trophy size={24} />
          </div>
        </div>

        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Drawn Winners</p>
            <h3 className="text-2xl font-bold text-white mt-1">{winners.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Award size={24} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab("wheel")}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "wheel"
              ? "border-[#155DFC] text-[#155DFC]"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Sparkles size={18} />
          Spin Wheel Winner Selection
        </button>

        <button
          onClick={() => setActiveTab("participants")}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "participants"
              ? "border-[#155DFC] text-[#155DFC]"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Users size={18} />
          All Entrants ({pagination.total})
        </button>

        <button
          onClick={() => setActiveTab("winners")}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "winners"
              ? "border-[#155DFC] text-[#155DFC]"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Trophy size={18} />
          Past Winners ({winners.length})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "settings"
              ? "border-[#155DFC] text-[#155DFC]"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Settings size={18} />
          Giveaway Settings
        </button>
      </div>

      {/* TAB 1: SPIN WHEEL */}
      {activeTab === "wheel" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Wheel Display Section */}
          <div className="lg:col-span-7 bg-[#111111] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between w-full">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Flame className="text-amber-500" size={20} />
                  Random Winner Wheel
                </h2>
                <p className="text-xs text-zinc-400">
                  Pool of 100 random participants loaded for fair selection
                </p>
              </div>
              <button
                onClick={handleRefreshPool}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 rounded-lg transition-all border border-white/5 cursor-pointer"
              >
                <RotateCw size={14} />
                Refresh Pool
              </button>
            </div>

            {/* Pointer */}
            <div className="relative flex items-center justify-center py-6">
              <div className="absolute top-2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-amber-400 drop-shadow-[0_4px_10px_rgba(245,158,11,0.5)]" />

              {/* Wheel Container */}
              <div
                className="w-80 h-80 sm:w-96 sm:h-96 rounded-full border-4 border-amber-500/40 shadow-[0_0_50px_rgba(21,93,252,0.2)] flex items-center justify-center relative overflow-hidden transition-transform duration-[4500ms] cubic-bezier(0.15, 0.9, 0.2, 1.0)"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {displayPool.map((p, i) => {
                    const sliceAngle = 360 / totalSlices;
                    const startAngle = i * sliceAngle;
                    const endAngle = (i + 1) * sliceAngle;
                    const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                    const largeArc = sliceAngle > 180 ? 1 : 0;
                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;
                    const color = colors[i % colors.length];

                    return (
                      <g key={i}>
                        <path d={pathData} fill={color} opacity={0.85} stroke="#111111" strokeWidth="0.5" />
                      </g>
                    );
                  })}
                </svg>
                {/* Center Hub */}
                <div className="absolute w-20 h-20 bg-[#111111] border-4 border-amber-400 rounded-full flex flex-col items-center justify-center z-10 shadow-2xl">
                  <Gift size={24} className="text-amber-400 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Spin Action */}
            <button
              onClick={handleSpinClick}
              disabled={spinning || poolLoading || randomPool.length === 0}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl ${
                spinning
                  ? "bg-amber-600 text-white opacity-80 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#155DFC] to-blue-600 hover:from-blue-600 hover:to-[#155DFC] text-white active:scale-95 shadow-blue-600/25"
              }`}
            >
              <Sparkles size={22} className={spinning ? "animate-spin" : ""} />
              {spinning ? "Spinning Wheel..." : "SPIN WHEEL FOR WINNER"}
            </button>
          </div>

          {/* Random Pool Entrants Sidebar */}
          <div className="lg:col-span-5 bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Users size={18} className="text-blue-400" />
                Wheel Candidate Pool ({randomPool.length})
              </h3>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {poolLoading ? (
                <div className="p-8 text-center text-zinc-500 text-sm">Loading candidate pool...</div>
              ) : randomPool.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">No entrants available in pool</div>
              ) : (
                randomPool.map((user, idx) => (
                  <div
                    key={user.id + idx}
                    className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-500/30">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedWinner(user);
                        setShowWinnerModal(true);
                      }}
                      className="px-2.5 py-1 bg-white/5 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-400 border border-white/5 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                    >
                      Pick Directly
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTICIPANTS LIST */}
      {activeTab === "participants" && (
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-white">Registered Participants</h2>

            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-80">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#155DFC]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#155DFC] hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Entry Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">Loading participants...</td>
                  </tr>
                ) : participants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">No giveaway participants found.</td>
                  </tr>
                ) : (
                  participants.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-sm border border-blue-500/20">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-mono text-xs">{p.email}</td>
                      <td className="py-3 px-4 text-zinc-400 text-xs">{p.enteredAt}</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Entered & Verified
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedWinner(p);
                            setShowWinnerModal(true);
                          }}
                          className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Pick Winner
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <span className="text-xs text-zinc-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="px-3 py-1.5 bg-black/40 disabled:opacity-40 border border-white/10 rounded-lg text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="px-3 py-1.5 bg-black/40 disabled:opacity-40 border border-white/10 rounded-lg text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAST WINNERS */}
      {activeTab === "winners" && (
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-amber-400" size={22} />
            Drawn Winner History
          </h2>

          {winners.length === 0 ? (
            <div className="p-12 text-center border border-white/5 rounded-2xl bg-black/20 space-y-3">
              <Trophy size={40} className="mx-auto text-zinc-600" />
              <p className="text-zinc-400 text-sm">No winners have been drawn yet.</p>
              <p className="text-xs text-zinc-600">Use the Spin Wheel tab to draw the official winner!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {winners.map((winner) => (
                <div key={winner.id} className="bg-black/40 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center">
                        🏆
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{winner.userName}</h3>
                        <p className="text-xs text-zinc-400 font-mono">{winner.userEmail}</p>
                      </div>
                    </div>
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                      Official Winner
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Prize:</span>
                      <span className="text-zinc-200 font-semibold">{winner.prizeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Drawn On:</span>
                      <span className="text-zinc-300">{winner.drawnAt}</span>
                    </div>
                    {winner.notes && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Notes:</span>
                        <span className="text-zinc-400 italic">{winner.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GIVEAWAY SETTINGS */}
      {activeTab === "settings" && (
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 max-w-2xl space-y-6">
          <h2 className="text-xl font-bold text-white">Giveaway Campaign Settings</h2>

          <form onSubmit={handleUpdateConfigSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Giveaway Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#155DFC]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Description / Rules
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#155DFC]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Banner Image URL
              </label>
              <input
                type="text"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#155DFC]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Winner Selection / Draw Date
              </label>
              <input
                type="text"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
                placeholder="2026-09-25"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#155DFC]"
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isActiveToggle"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-white/10 accent-[#155DFC] cursor-pointer"
              />
              <label htmlFor="isActiveToggle" className="text-sm font-semibold text-zinc-200 cursor-pointer">
                Giveaway Active (Allows user entries)
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3 bg-[#155DFC] hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                Save Giveaway Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WINNER SELECTION CONFIRMATION MODAL */}
      {showWinnerModal && selectedWinner && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-amber-500/30 rounded-3xl p-8 max-w-md w-full space-y-6 text-center animate-in zoom-in-95 duration-200 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 border-2 border-amber-500 flex items-center justify-center mx-auto text-4xl shadow-inner">
              🏆
            </div>

            <div className="space-y-2">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Winner Drawn
              </span>
              <h3 className="text-2xl font-bold text-white">{selectedWinner.name}</h3>
              <p className="text-sm text-zinc-400 font-mono">{selectedWinner.email}</p>
            </div>

            <div className="bg-black/40 border border-white/5 p-4 rounded-xl text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Prize:</span>
                <span className="text-amber-400 font-bold">Michael Vick Autographed Jersey</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Selection Method:</span>
                <span className="text-zinc-300">Random Fair Selection</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWinnerModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-bold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWinner}
                disabled={drawing}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {drawing ? "Confirming..." : "Confirm Official Winner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
