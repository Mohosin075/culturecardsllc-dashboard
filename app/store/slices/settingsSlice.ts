import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/app/lib/api";

export const fetchSettings = createAsyncThunk("settings/fetchSettings", async () => {
  return await api.dashboard.getSettings();
});

export const updateSettings = createAsyncThunk(
  "settings/updateSettings",
  async (flatSettings: any) => {
    const formattedSettings = {
      commissionSettings: {
        purchaseCommission: flatSettings.commissionPurchase,
        tradeCommission: flatSettings.commissionTrade,
      },
      paymentGateway: {
        primaryProcessor: flatSettings.gatewayName,
        apiKey: flatSettings.gatewayKey,
        enableTestMode: flatSettings.testMode,
      },
      notificationSettings: {
        newOrderNotifications: flatSettings.toggles?.newOrder,
        disputeAlerts: flatSettings.toggles?.dispute,
        systemAlerts: flatSettings.toggles?.system,
      },
      securitySettings: {
        twoFactorAuthentication: flatSettings.toggles?.twoFactor,
        ipWhitelist: flatSettings.toggles?.ipWhitelist,
        sessionTimeout: typeof flatSettings.sessionTimeout === "string" ? (flatSettings.sessionTimeout === "0" ? 0 : parseInt(flatSettings.sessionTimeout) || 30) : flatSettings.sessionTimeout,
      },
    };
    return await api.dashboard.updateSettings(formattedSettings);
  }
);

interface SettingsState {
  data: any | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  data: null,
  loading: false,
  saving: false,
  error: null,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load settings";
      })
      .addCase(updateSettings.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.saving = false;
        state.data = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || "Failed to update settings";
      });
  },
});

export default settingsSlice.reducer;
