import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/app/lib/api";

export const fetchReports = createAsyncThunk("reports/fetchReports", async (range?: string) => {
  return await api.dashboard.getReports(range);
});

interface ReportsState {
  data: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  data: null,
  loading: false,
  error: null,
};

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load reports";
      });
  },
});

export default reportsSlice.reducer;
