import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/app/lib/api";

export interface RefundParty {
  id?: string;
  name: string;
  email?: string;
}

export interface RefundRequestItem {
  id: string;
  orderId?: string;
  buyer: RefundParty;
  seller: RefundParty;
  reason: string;
  details?: string;
  evidenceUrls: string[];
  requestedAmount: number;
  orderTotal?: number | null;
  deliveryStatus?: string | null;
  status: "pending" | "approved" | "rejected" | "failed";
  decisionNote?: string;
  refundedAmount?: number;
  reviewedAt?: string;
  createdAt?: string;
}

export const fetchRefundRequests = createAsyncThunk(
  "refunds/fetchRefundRequests",
  async (status: string | undefined) => {
    return await api.refunds.list(status);
  }
);

export const approveRefund = createAsyncThunk(
  "refunds/approveRefund",
  async ({ id, amount, note }: { id: string; amount?: number; note?: string }) => {
    await api.refunds.approve(id, { amount, note });
    return id;
  }
);

export const rejectRefund = createAsyncThunk(
  "refunds/rejectRefund",
  async ({ id, note }: { id: string; note: string }) => {
    await api.refunds.reject(id, note);
    return id;
  }
);

interface RefundsState {
  items: RefundRequestItem[];
  loading: boolean;
  error: string | null;
}

const initialState: RefundsState = {
  items: [],
  loading: false,
  error: null,
};

const refundsSlice = createSlice({
  name: "refunds",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRefundRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRefundRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = (action.payload || []).map((r: any) => ({
          id: String(r.id || r._id || ""),
          orderId: r.orderId,
          buyer: r.buyer || { name: "Buyer" },
          seller: r.seller || { name: "Seller" },
          reason: r.reason || "other",
          details: r.details,
          evidenceUrls: r.evidenceUrls || [],
          requestedAmount: Number(r.requestedAmount || 0),
          orderTotal: r.orderTotal ?? null,
          deliveryStatus: r.deliveryStatus ?? null,
          status: r.status || "pending",
          decisionNote: r.decisionNote,
          refundedAmount: r.refundedAmount,
          reviewedAt: r.reviewedAt,
          createdAt: r.createdAt,
        }));
      })
      .addCase(fetchRefundRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load refund requests";
      })
      .addCase(approveRefund.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      })
      .addCase(rejectRefund.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      });
  },
});

export default refundsSlice.reducer;
