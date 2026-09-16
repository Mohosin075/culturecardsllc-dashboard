"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/app/lib/api";

export interface User {
  userId: string;
  name: string;
  username: string;
  email: string;
  role: string;
  rating: number;
  transactions: number;
  status: "Active" | "Suspended";
  isCelebrity?: boolean;
  color?: string;
}

interface RawUser {
  _id?: string;
  userId?: string;
  id?: string;
  fullName?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  roles?: string[];
  rating?: number;
  transactions?: number;
  status?: string;
  isCelebrity?: boolean;
}

export const fetchUsers = createAsyncThunk("users/fetchUsers", async () => {
  return await api.users.getAll() as RawUser[];
});

export const updateUserStatus = createAsyncThunk(
  "users/updateUserStatus",
  async ({ userId, status }: { userId: string; status: string }) => {
    const backendStatus = status === "Active" ? "active" : "inactive";
    await api.users.updateStatus(userId, backendStatus);
    return { userId, status };
  }
);


export const toggleUserCelebrity = createAsyncThunk(
  "users/toggleUserCelebrity",
  async ({ userId, isCelebrity }: { userId: string; isCelebrity: boolean }) => {
    await api.users.update(userId, { isCelebrity });
    return { userId, isCelebrity };
  }
);

export const deleteUser = createAsyncThunk("users/deleteUser", async (userId: string) => {
  await api.users.delete(userId);
  return userId;
});

interface UsersState {
  items: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  items: [],
  loading: false,
  error: null,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = (action.payload || []).map((user: RawUser, idx: number) => {
          const usernameStr = user.email
            ? `@${user.email.split("@")[0]}`
            : `@user${idx + 1}`;
          const displayRole = user.roles ? user.roles.join("/") : (user.role || "Buyer");
          return {
            userId: user._id || user.userId || user.id || "",
            name: user.fullName || user.name || "Anonymous User",
            username: user.username || usernameStr,
            email: user.email || "no-email@example.com",
            role: displayRole,
            rating: user.rating !== undefined ? user.rating : 0,
            transactions: user.transactions !== undefined ? user.transactions : 0,
            status: user.status === "active" ? "Active" : "Suspended",
            isCelebrity: Boolean(user.isCelebrity),
          };
        });
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load users";
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const { userId, status } = action.payload;
        state.items = state.items.map((user) =>
          user.userId === userId ? { ...user, status: status as "Active" | "Suspended" } : user
        );
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.error = action.error.message || "Failed to update user status";
      })
      
      .addCase(toggleUserCelebrity.fulfilled, (state, action) => {
        const { userId, isCelebrity } = action.payload;
        state.items = state.items.map((user) =>
          user.userId === userId ? { ...user, isCelebrity } : user
        );
      })
      .addCase(toggleUserCelebrity.rejected, (state, action) => {
        state.error = action.error.message || "Failed to update celebrity status";
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        const userId = action.payload;
        state.items = state.items.filter((user) => user.userId !== userId);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete user";
      });
  },
});

export default usersSlice.reducer;
