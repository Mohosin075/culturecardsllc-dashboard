import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/app/lib/api";

export interface SellerVerificationRequest {
  id: string;
  name: string;
  email: string;
  status: string;
  category: string;
  submitted: string;
  documents: string[];
}

export const fetchSellerVerifications = createAsyncThunk(
  "sellerVerification/fetchSellerVerifications",
  async () => {
    return await api.dashboard.getSellerVerifications();
  }
);

export const approveVerification = createAsyncThunk(
  "sellerVerification/approveVerification",
  async (id: string) => {
    await api.dashboard.approveSellerVerification(id);
    return id;
  }
);

export const rejectVerification = createAsyncThunk(
  "sellerVerification/rejectVerification",
  async ({ id, reason }: { id: string; reason: string }) => {
    await api.dashboard.rejectSellerVerification(id, reason);
    return id;
  }
);

interface SellerVerificationState {
  items: SellerVerificationRequest[];
  loading: boolean;
  error: string | null;
}

const initialState: SellerVerificationState = {
  items: [],
  loading: false,
  error: null,
};

const isObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

const sellerVerificationSlice = createSlice({
  name: "sellerVerification",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerVerifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerVerifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = (action.payload || [])
          .map((req: any) => {
            const reqId = req.userId || req._id || req.id || "";
            return {
              id: reqId,
              name: req.name || "",
              email: req.email || "",
              status: req.status || "Pending",
              category: req.category || "",
              submitted: req.submitted || "",
              documents: req.documents || req.submittedDocuments || [],
            };
          })
          .filter((req: any) => isObjectId(req.id));
      })
      .addCase(fetchSellerVerifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load verification requests";
      })
      .addCase(approveVerification.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      })
      .addCase(rejectVerification.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      });
  },
});

export default sellerVerificationSlice.reducer;
