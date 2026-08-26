import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/app/lib/api";

export interface BoostedListing {
  id: string;
  name: string;
  seller: string;
  level: string;
  duration: string;
  period: string;
  impressions: string;
  fee: string;
  status: string;
  productId?: string;
  image?: string;
  price?: number;
}

export const fetchBoostedListings = createAsyncThunk(
  "boostedListings/fetchBoostedListings",
  async () => {
    return await api.dashboard.getBoostedListings();
  }
);

interface BoostedListingsState {
  items: BoostedListing[];
  loading: boolean;
  error: string | null;
}

const initialState: BoostedListingsState = {
  items: [],
  loading: false,
  error: null,
};

const boostedListingsSlice = createSlice({
  name: "boostedListings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoostedListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoostedListings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = (action.payload || []).map((item: any) => ({
          id: item.id || item.boostId || "",
          name: item.name || item.listingName || item.item || "Featured Item",
          seller: item.seller || "",
          level: item.level || item.boostLevel || "Standard",
          duration: item.duration || "7 days",
          period: item.period || "",
          impressions: item.impressions !== undefined ? (typeof item.impressions === "number" ? new Intl.NumberFormat().format(item.impressions) : item.impressions) : "0",
          fee: item.fee !== undefined ? item.fee : (typeof item.feePaid === "number" ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.feePaid) : (item.feePaid || "$0.00")),
          status: item.status || "Active",
          productId: item.productId,
          image: item.image,
          price: item.price,
        }));
      })
      .addCase(fetchBoostedListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load boosted listings";
      });
  },
});

export default boostedListingsSlice.reducer;
