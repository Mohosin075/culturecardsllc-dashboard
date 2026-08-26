import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/app/lib/api";

export interface DisputeItem {
  id: string;
  status: string;
  priority: string;
  date: string;
  users: Array<{ name: string; color: string; initial: string }>;
  targetId: string;
  issueType: string;
  description: string;
}

export const fetchDisputes = createAsyncThunk("disputes/fetchDisputes", async () => {
  return await api.dashboard.getDisputes();
});

export const resolveDispute = createAsyncThunk(
  "disputes/resolveDispute",
  async (id: string) => {
    await api.dashboard.resolveDispute(id);
    return id;
  }
);

export const rejectDispute = createAsyncThunk(
  "disputes/rejectDispute",
  async ({ id, reason }: { id: string; reason: string }) => {
    await api.dashboard.rejectDispute(id, reason);
    return id;
  }
);

interface DisputesState {
  items: DisputeItem[];
  loading: boolean;
  error: string | null;
}

const initialState: DisputesState = {
  items: [],
  loading: false,
  error: null,
};

const disputesSlice = createSlice({
  name: "disputes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDisputes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDisputes.fulfilled, (state, action) => {
        state.loading = false;
        const payloadData = Array.isArray(action.payload)
          ? action.payload
          : (action.payload as any)?.data || [];
        state.items = payloadData.map((d: any) => {
          const reporterName = d.usersInvolved?.[0] || d.userId?.fullName || d.userId?.name || "Reporter";
          const reportedName = d.usersInvolved?.[1] || d.reportedUser?.fullName || d.reportedUser?.name || "Seller";
          const usersMapped = [
            { name: reporterName, color: "bg-blue-500", initial: reporterName.charAt(0).toUpperCase() },
            { name: reportedName, color: "bg-teal-500", initial: reportedName.charAt(0).toUpperCase() }
          ];

          const displayStatus = d.status === "pending" || d.status === "Open"
            ? "Open"
            : (d.status === "under_review" || d.status === "Reviewing" ? "Reviewing" : (d.status === "solved" || d.status === "Resolved" ? "Resolved" : "Rejected"));

          const displayPriority = d.severity || d.priority
            ? ((d.severity || d.priority).charAt(0).toUpperCase() + (d.severity || d.priority).slice(1))
            : "Medium";

          const formattedDate = d.openedOn || (d.createdAt
            ? new Date(d.createdAt).toISOString().split("T")[0]
            : "-");

          return {
            id: d.id || d._id || d.disputeId || "",
            status: displayStatus,
            priority: displayPriority,
            date: formattedDate,
            users: usersMapped,
            targetId: d.orderOrTradeId || d.contentId || "-",
            issueType: d.issueType || d.subject || (d.reason === "fraud" ? "Item not as described" : "Wrong item received"),
            description: d.description || d.message || "Defects or trade matching issues reported",
          };
        });
      })
      .addCase(fetchDisputes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load disputes";
      })
      .addCase(resolveDispute.fulfilled, (state, action) => {
        state.items = state.items.map((dispute) =>
          dispute.id === action.payload ? { ...dispute, status: "Resolved" } : dispute
        );
      })
      .addCase(rejectDispute.fulfilled, (state, action) => {
        state.items = state.items.map((dispute) =>
          dispute.id === action.payload ? { ...dispute, status: "Rejected" } : dispute
        );
      });
  },
});

export default disputesSlice.reducer;
