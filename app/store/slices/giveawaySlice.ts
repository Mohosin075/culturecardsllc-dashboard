import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/app/lib/api";

export interface GiveawayParticipant {
  id: string;
  userId: string;
  name: string;
  email: string;
  enteredAt: string;
  avatar?: string;
  verified?: boolean;
}

export interface GiveawayWinner {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  prizeName: string;
  drawnAt: string;
  notes?: string;
}

export interface GiveawayConfig {
  title: string;
  description: string;
  bannerUrl: string;
  endDate: string;
  drawDate: string;
  isActive: boolean;
  totalEntries: number;
}

interface GiveawayState {
  config: GiveawayConfig | null;
  participants: GiveawayParticipant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  randomPool: GiveawayParticipant[];
  winners: GiveawayWinner[];
  loading: boolean;
  poolLoading: boolean;
  drawing: boolean;
  error: string | null;
}

const initialState: GiveawayState = {
  config: null,
  participants: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  randomPool: [],
  winners: [],
  loading: false,
  poolLoading: false,
  drawing: false,
  error: null,
};

export const fetchGiveawayConfig = createAsyncThunk(
  "giveaway/fetchConfig",
  async () => {
    return await api.giveaway.getConfig();
  }
);

export const updateGiveawayConfig = createAsyncThunk(
  "giveaway/updateConfig",
  async (data: Record<string, any>) => {
    return await api.giveaway.updateConfig(data);
  }
);

export const fetchGiveawayParticipants = createAsyncThunk(
  "giveaway/fetchParticipants",
  async ({ page = 1, limit = 20, search = "" }: { page?: number; limit?: number; search?: string } = {}) => {
    return await api.giveaway.getParticipants(page, limit, search);
  }
);

export const fetchRandomPool = createAsyncThunk(
  "giveaway/fetchRandomPool",
  async (count: number = 100) => {
    return await api.giveaway.getRandomPool(count);
  }
);

export const fetchGiveawayWinners = createAsyncThunk(
  "giveaway/fetchWinners",
  async () => {
    return await api.giveaway.getWinners();
  }
);

export const drawGiveawayWinner = createAsyncThunk(
  "giveaway/drawWinner",
  async ({ userId, prizeName, notes }: { userId: string; prizeName?: string; notes?: string }) => {
    return await api.giveaway.drawWinner(userId, prizeName, notes);
  }
);

const giveawaySlice = createSlice({
  name: "giveaway",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Config
      .addCase(fetchGiveawayConfig.fulfilled, (state, action) => {
        state.config = action.payload;
      })
      .addCase(updateGiveawayConfig.fulfilled, (state, action) => {
        state.config = action.payload;
      })
      // Participants
      .addCase(fetchGiveawayParticipants.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGiveawayParticipants.fulfilled, (state, action: any) => {
        state.loading = false;
        const res = action.payload || {};
        const meta = res.meta || {};
        state.pagination = {
          page: meta.page || 1,
          limit: meta.limit || 20,
          total: meta.total || (res.participants ? res.participants.length : 0),
          totalPages: meta.totalPage || meta.totalPages || 1,
        };
        const rawList = res.participants || res.data || (Array.isArray(res) ? res : []);
        state.participants = rawList.map((p: any) => ({
          id: p._id || p.id || "",
          userId: p.userId?._id || p.userId?.id || p.userId || "",
          name: p.userId?.fullName || p.userId?.name || p.name || "User",
          email: p.userId?.email || p.email || "",
          enteredAt: p.enteredAt || p.createdAt ? new Date(p.enteredAt || p.createdAt).toLocaleString() : "Recently",
          avatar: p.userId?.profileImage || p.userId?.avatar || "",
          verified: p.userId?.isEmailVerified ?? true,
        }));
      })
      .addCase(fetchGiveawayParticipants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load participants";
      })
      // Random Pool
      .addCase(fetchRandomPool.pending, (state) => {
        state.poolLoading = true;
      })
      .addCase(fetchRandomPool.fulfilled, (state, action: any) => {
        state.poolLoading = false;
        const res = action.payload || {};
        const pool = res.pool || res.data || (Array.isArray(res) ? res : []);
        state.randomPool = pool.map((p: any) => ({
          id: p._id || p.id || "",
          userId: p.userId?._id || p.userId?.id || p.userId || "",
          name: p.userId?.fullName || p.userId?.name || p.name || "User",
          email: p.userId?.email || p.email || "",
          enteredAt: p.enteredAt || p.createdAt ? new Date(p.enteredAt || p.createdAt).toLocaleDateString() : "",
          avatar: p.userId?.profileImage || p.userId?.avatar || "",
          verified: true,
        }));
      })
      .addCase(fetchRandomPool.rejected, (state) => {
        state.poolLoading = false;
      })
      // Winners
      .addCase(fetchGiveawayWinners.fulfilled, (state, action: any) => {
        const rawWinners = action.payload?.winners || action.payload || [];
        state.winners = rawWinners.map((w: any) => ({
          id: w._id || w.id || "",
          userId: w.userId?._id || w.userId || "",
          userName: w.userId?.fullName || w.userId?.name || w.userName || "Winner",
          userEmail: w.userId?.email || w.userEmail || "",
          prizeName: w.prizeName || "Michael Vick Autographed Jersey",
          drawnAt: w.drawnAt ? new Date(w.drawnAt).toLocaleDateString() : "Recent",
          notes: w.notes || "",
        }));
      })
      // Draw Winner
      .addCase(drawGiveawayWinner.pending, (state) => {
        state.drawing = true;
      })
      .addCase(drawGiveawayWinner.fulfilled, (state) => {
        state.drawing = false;
      })
      .addCase(drawGiveawayWinner.rejected, (state) => {
        state.drawing = false;
      });
  },
});

export default giveawaySlice.reducer;
