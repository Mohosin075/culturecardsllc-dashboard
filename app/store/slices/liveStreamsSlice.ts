"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/app/lib/api";

export interface LiveStream {
  id: string;
  title: string;
  seller: string;
  category: string;
  viewers: number;
  likes: number;
  chatMessages: Array<{ id: string; user: string; text: string }>;
  duration: string;
  thumbnail?: string;
  agoraChannelName?: string;
}

export interface ScheduledStream {
  id: string;
  title: string;
  seller: string;
  category: string;
  time: string;
  agoraChannelName?: string;
}

interface RawLiveStream {
  id?: string;
  _id?: string;
  streamId?: string;
  title?: string;
  seller?: string;
  host?: string;
  hostName?: string;
  category?: string;
  viewers?: number;
  viewerCount?: number;
  viewersCount?: number;
  likes?: number;
  likesCount?: number;
  chatMessages?: Array<{ id?: string; _id?: string; user?: string; text?: string; message?: string }>;
  duration?: string;
  thumbnail?: string;
  agoraChannelName?: string;
}

interface RawScheduledStream {
  id?: string;
  _id?: string;
  streamId?: string;
  title?: string;
  seller?: string;
  host?: string;
  hostName?: string;
  category?: string;
  time?: string;
  scheduledTime?: string;
  scheduledAt?: string;
  startTime?: string;
  agoraChannelName?: string;
}

export interface FetchLiveStreamsResponse {
  currentlyLive?: RawLiveStream[];
  live?: RawLiveStream[];
  active?: RawLiveStream[];
  scheduled?: RawScheduledStream[];
  upcoming?: RawScheduledStream[];
  channelMap?: Record<string, string>;
}

export const fetchLiveStreams = createAsyncThunk("liveStreams/fetchLiveStreams", async () => {
  const [dashboardData, auctionsData] = await Promise.allSettled([
    api.dashboard.getLiveStreams(),
    api.auctions.getStreams(),
  ]);

  const dashRes = dashboardData.status === "fulfilled" ? dashboardData.value : {};
  const aucList: any[] = auctionsData.status === "fulfilled" && Array.isArray(auctionsData.value) 
    ? auctionsData.value 
    : (auctionsData.status === "fulfilled" && Array.isArray((auctionsData.value as any)?.data)) 
      ? (auctionsData.value as any).data 
      : [];

  const channelMap: Record<string, string> = {};
  aucList.forEach((s) => {
    const sId = (s._id || s.id || "").toString();
    if (sId && s.agoraChannelName) {
      channelMap[sId.toLowerCase()] = s.agoraChannelName;
    }
  });

  return {
    ...dashRes,
    channelMap,
  } as FetchLiveStreamsResponse;
});

// No backend endpoint for cancelling a scheduled stream — local state only
export const cancelScheduledStream = createAsyncThunk(
  "liveStreams/cancelScheduledStream",
  async (id: string) => {
    return id;
  }
);

interface LiveStreamsState {
  live: LiveStream[];
  scheduled: ScheduledStream[];
  loading: boolean;
  isInitialLoaded: boolean;
  error: string | null;
}

const initialState: LiveStreamsState = {
  live: [],
  scheduled: [],
  loading: false,
  isInitialLoaded: false,
  error: null,
};

const liveStreamsSlice = createSlice({
  name: "liveStreams",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLiveStreams.pending, (state) => {
        if (!state.isInitialLoaded) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchLiveStreams.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialLoaded = true;
        const payload = action.payload;
        const channelMap = payload?.channelMap || {};

        state.live = (payload?.currentlyLive || payload?.live || payload?.active || []).map((s: RawLiveStream) => {
          const rawId = (s._id || s.id || s.streamId || "").toString();
          const channel = s.agoraChannelName || channelMap[rawId.toLowerCase()] || `stream_${rawId}`;
          return {
            id: rawId,
            title: s.title || "Live Stream",
            seller: s.seller || s.host || s.hostName || "Seller",
            category: s.category || "",
            viewers: s.viewers || s.viewerCount || s.viewersCount || 0,
            likes: s.likes || s.likesCount || 0,
            chatMessages: (s.chatMessages || []).map((msg) => ({
              id: msg.id || msg._id || Math.random().toString(),
              user: msg.user || "User",
              text: msg.text || msg.message || ""
            })),
            duration: s.duration || "—",
            thumbnail: s.thumbnail || "",
            agoraChannelName: channel,
          };
        });

        state.scheduled = (payload?.scheduled || payload?.upcoming || []).map((s: RawScheduledStream) => {
          const rawId = (s._id || s.id || s.streamId || "").toString();
          const channel = s.agoraChannelName || channelMap[rawId.toLowerCase()] || "";
          return {
            id: rawId,
            title: s.title || "Scheduled Stream",
            seller: s.seller || s.host || s.hostName || "Seller",
            category: s.category || "",
            time: s.time || s.scheduledTime || s.scheduledAt || s.startTime || "",
            agoraChannelName: channel,
          };
        });
      })
      .addCase(fetchLiveStreams.rejected, (state, action) => {
        state.loading = false;
        state.isInitialLoaded = true;
        state.error = action.error.message || "Failed to load live streams";
      })
      .addCase(cancelScheduledStream.fulfilled, (state, action) => {
        state.scheduled = state.scheduled.filter((stream) => stream.id !== action.payload);
      });
  },
});

export default liveStreamsSlice.reducer;
