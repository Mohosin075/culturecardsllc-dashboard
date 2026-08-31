"use client";

import React, { useEffect, useState } from "react";
import { Radio, Users, Clock, Flag, Star, Calendar, Loader2, Search, Filter } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import {
  fetchLiveStreams,
  cancelScheduledStream,
  type LiveStream,
  type ScheduledStream,
} from "@/app/store/slices/liveStreamsSlice";
import ErrorState from "@/app/components/ErrorState";
import { useAlert } from "@/app/context/AlertContext";
import ScheduledStreamModal from "@/app/components/ScheduledStreamModal";
import LiveStreamModal from "@/app/components/LiveStreamModal";

export default function LiveStreamsPage() {
  const dispatch = useAppDispatch();
  const { live: liveStreams, scheduled: scheduledStreams, loading, isInitialLoaded, error } = useAppSelector(
    (state) => state.liveStreams
  );
  const [selectedStream, setSelectedStream] = useState<ScheduledStream | null>(null);
  const [selectedLiveStream, setSelectedLiveStream] = useState<LiveStream | null>(null);
  const [favoritedStreams, setFavoritedStreams] = useState<string[]>([]);
  const [reportedStreams, setReportedStreams] = useState<string[]>([]);
  const { showAlert, showConfirm } = useAlert();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredLiveStreams = liveStreams.filter((stream: LiveStream) => {
    const matchesSearch =
      stream.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.seller?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || stream.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const filteredScheduledStreams = scheduledStreams.filter((stream: ScheduledStream) => {
    const matchesSearch =
      stream.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.seller?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || stream.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Polling setup: fetch live streams every 8 seconds for real-time updates (paused when viewing a stream)
  useEffect(() => {
    dispatch(fetchLiveStreams());
    if (selectedLiveStream) return;

    const interval = setInterval(() => {
      dispatch(fetchLiveStreams());
    }, 8000);
    return () => clearInterval(interval);
  }, [dispatch, selectedLiveStream]);

  const handleCancelStream = (id: string) => {
    showConfirm(
      "Are you sure you want to cancel this scheduled stream?",
      () => {
        dispatch(cancelScheduledStream(id));
        showAlert("Scheduled stream cancelled successfully.", "success");
      },
      "Cancel Scheduled Stream"
    );
  };

  const handleToggleFavorite = (id: string) => {
    setFavoritedStreams((prev) => {
      const isFav = prev.includes(id);
      if (isFav) {
        showAlert("Removed from favorites", "info");
        return prev.filter((item) => item !== id);
      } else {
        showAlert("Added to favorites!", "success");
        return [...prev, id];
      }
    });
  };

  const handleReportStream = (id: string) => {
    if (reportedStreams.includes(id)) {
      showAlert("You have already reported this stream.", "info");
      return;
    }
    showConfirm(
      "Are you sure you want to flag and report this live stream for review?",
      () => {
        setReportedStreams((prev) => [...prev, id]);
        showAlert("Stream reported successfully. Admin will review.", "success");
      },
      "Report Stream"
    );
  };

  if (loading && !isInitialLoaded) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#155DFC]" size={40} />
      </div>
    );
  }
  if (error && !isInitialLoaded) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchLiveStreams())} />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-semibold text-white">Live Auctions</h1>
        {liveStreams.length > 0 && (
          <div className="flex items-center gap-2 mt-4 text-red-500">
            <Radio size={20} className="animate-pulse" />
            <span className="font-bold uppercase tracking-widest text-xs">Currently Live ({filteredLiveStreams.length})</span>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search streams by title or seller..."
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
              isFilterOpen || categoryFilter !== "All"
                ? "border-[#155DFC] text-white"
                : "border-white/5"
            }`}
          >
            <Filter size={18} />
            <span className="font-medium">Filter</span>
            {categoryFilter !== "All" && (
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
                      setCategoryFilter("All");
                    }}
                    className="text-[10px] text-[#155DFC] hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>

                {/* Category Filter Pills */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Sneakers", "Cards", "Watches", "TCG"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          categoryFilter.toLowerCase() === cat.toLowerCase()
                            ? "bg-[#155DFC] text-white shadow-lg shadow-[#155DFC]/20"
                            : "bg-black/40 text-zinc-400 hover:text-white border border-white/5"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Currently Live Grid */}
      {filteredLiveStreams.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-[#111111] border border-white/5 rounded-3xl text-center space-y-4 max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 border border-white/10 shadow-inner">
            <Radio size={28} className="text-zinc-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">
              {liveStreams.length > 0 ? "No Matching Streams" : "No Live Auctions"}
            </h3>
            <p className="text-zinc-500 text-sm max-w-sm">
              {liveStreams.length > 0
                ? "No live streams match your current search or filter."
                : "There are no auctions currently live at this moment."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLiveStreams.map((stream: LiveStream) => (
            <div key={stream.id} className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden group">
              {/* Thumbnail Placeholder */}
              <div className={`aspect-video w-full relative ${stream.thumbnail ?? 'bg-gradient-to-br from-indigo-900 to-blue-900'} flex items-center justify-center`}>
                <Radio size={48} className="text-white/20 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Live
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                  <Users size={12} />
                  {stream.viewers}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-zinc-100 line-clamp-1 group-hover:text-[#155DFC] transition-colors">
                    {stream.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-zinc-500">
                    <Users size={14} />
                    <span className="text-xs">{stream.seller}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20 uppercase">
                    {stream.category}
                  </span>
                  <div className="flex items-center gap-1 text-zinc-500">
                    <Clock size={12} />
                    <span className="text-[10px]">{stream.duration}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedLiveStream(stream)}
                    className="flex-1 bg-[#155DFC] hover:bg-blue-600 text-white py-2 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    View Stream
                  </button>
                  <button
                    onClick={() => handleReportStream(stream.id)}
                    className={`p-2 rounded-xl transition-all cursor-pointer border ${
                      reportedStreams.includes(stream.id)
                        ? "bg-red-500/20 text-red-500 border-red-500/30"
                        : "bg-black/40 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 border-white/5 hover:border-red-500/20"
                    }`}
                    title="Report Live Stream"
                  >
                    <Flag size={18} className={reportedStreams.includes(stream.id) ? "fill-red-500" : ""} />
                  </button>
                  <button
                    onClick={() => handleToggleFavorite(stream.id)}
                    className={`p-2 rounded-xl transition-all cursor-pointer border ${
                      favoritedStreams.includes(stream.id)
                        ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                        : "bg-black/40 text-zinc-400 hover:text-yellow-500 hover:bg-yellow-500/10 border-white/5 hover:border-yellow-500/20"
                    }`}
                    title="Favorite Live Stream"
                  >
                    <Star size={18} className={favoritedStreams.includes(stream.id) ? "fill-yellow-500" : ""} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scheduled Streams */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-blue-500">
          <Calendar size={20} />
          <h2 className="text-xl font-bold uppercase tracking-widest text-xs">Scheduled Streams</h2>
        </div>

        {filteredScheduledStreams.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[#111111] border border-white/5 rounded-3xl text-center space-y-4 max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 border border-white/10 shadow-inner">
              <Calendar size={28} className="text-zinc-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">
                {scheduledStreams.length > 0 ? "No Matching Streams" : "No Scheduled Streams"}
              </h3>
              <p className="text-zinc-500 text-sm max-w-sm">
                {scheduledStreams.length > 0
                  ? "No scheduled streams match your current search or filter."
                  : "There are no upcoming scheduled streams at this time."}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Stream ID</th>
                    <th className="px-6 py-4 font-medium">Title</th>
                    <th className="px-6 py-4 font-medium">Seller</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Scheduled Time</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredScheduledStreams.map((stream: ScheduledStream) => (
                    <tr key={stream.id} className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-zinc-500">{stream.id}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-zinc-200">{stream.title}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {stream.seller}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-1 rounded border border-blue-500/20 uppercase">
                          {stream.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400 font-medium">
                        {stream.time}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedStream(stream)}
                            className="bg-[#155DFC]/10 hover:bg-[#155DFC] text-[#155DFC] hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-[#155DFC]/20 cursor-pointer"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleCancelStream(stream.id)}
                            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-red-500/20 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stream Details Modal */}
      <ScheduledStreamModal
        stream={selectedStream}
        onClose={() => setSelectedStream(null)}
      />

      {/* Live Stream View Modal (Real-time Simulation) */}
      <LiveStreamModal
        key={selectedLiveStream?.id || "empty"}
        stream={selectedLiveStream}
        onClose={() => setSelectedLiveStream(null)}
        isFavorited={selectedLiveStream ? favoritedStreams.includes(selectedLiveStream.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
