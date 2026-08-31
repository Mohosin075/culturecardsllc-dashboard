import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/app/lib/api";

export interface VerificationDocument {
  name: string;
  url?: string;
  type?: string;
}

export interface SellerVerificationRequest {
  id: string;
  name: string;
  email: string;
  status: string;
  category: string;
  submitted: string;
  documents: Array<string | VerificationDocument>;
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
              id: String(reqId),
              name: req.name || req.fullName || "Applicant",
              email: req.email || "",
              status: req.status || "Pending",
              category: req.category || "General",
              submitted: req.submitted || req.createdAt ? new Date(req.submitted || req.createdAt).toLocaleDateString() : "Recent",
              documents: (req.documents || req.submittedDocuments || []).map((d: any) => {
                if (typeof d === "string") return d;
                return {
                  name: d.name || d.title || d.fileName || "Document",
                  url: d.url || d.fileUrl || d.path || "",
                  type: d.type || d.fileType || "",
                };
              }),
            };
          })
          .filter((req: any) => Boolean(req.id && req.id.trim()));
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
