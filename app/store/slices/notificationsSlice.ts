import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/app/lib/api";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async () => {
    return await api.dashboard.getNotifications();
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllNotificationsRead",
  async () => {
    await api.dashboard.markNotificationsRead();
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markNotificationRead",
  async (id: string | number) => {
    await api.notifications.markRead(id.toString());
    return id;
  }
);

export interface SystemNotification {
  id: string | number;
  title: string;
  category?: string;
  text: string;
  date: string;
  type: string;
  read: boolean;
}

interface NotificationsState {
  items: SystemNotification[];
  loading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;

        let rawNotifications: any[] = [];
        const payload = action.payload as any;

        if (Array.isArray(payload)) {
          rawNotifications = payload;
        } else if (payload && typeof payload === "object") {
          rawNotifications = payload.notifications || payload.data || [];
        }

        const normalizeType = (rawType?: string, rawCategory?: string): string => {
          const val = (rawType || rawCategory || "").toLowerCase();
          if (val.includes("order") || val.includes("payment") || val.includes("purchase")) return "order";
          if (val.includes("trade") || val.includes("offer") || val.includes("swap")) return "trade";
          if (val.includes("dispute") || val.includes("report")) return "dispute";
          return "system";
        };

        state.items = rawNotifications.map((item: any, idx: number) => ({
          id: item.id || item._id || `NTF-${(idx + 1).toString().padStart(3, "0")}`,
          title: item.title || "Notification",
          category: item.category || item.type,
          text: item.text || item.message || item.content || item.body || "",
          date: item.date || item.timeAgo || item.createdAt || "Just now",
          type: normalizeType(item.type, item.category),
          read: item.read !== undefined ? item.read : (item.isRead !== undefined ? item.isRead : false),
        }));
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load notifications";
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, read: true }));
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.error = action.error.message || "Failed to mark all as read";
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.items = state.items.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        );
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        state.error = action.error.message || "Failed to mark notification as read";
      });
  },
});

export default notificationsSlice.reducer;
