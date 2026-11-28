"use client";

// Check if window is defined (Next.js SSR safety)
const isClient = typeof window !== "undefined";

export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
      /^192\.168\.\d+\.\d+$/.test(hostname)
    ) {
      return `http://${hostname}:5001/api/v1`;
    }
    if (hostname.includes("areisco.com")) {
      return `${protocol}//api.areisco.com/api/v1`;
    }
    return `${protocol}//${hostname}/api/v1`;
  }
  return "https://api.areisco.com/api/v1";
};

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.message || data?.error || fallback;
  } catch {
    return fallback;
  }
}

class ApiClient {
  public isLive = false;
  private token: string | null = null;

  constructor() {
    if (isClient) {
      this.token = localStorage.getItem("admin_access_token");
      this.ping();
    }
  }

  private setLive(live: boolean) {
    if (this.isLive !== live) {
      this.isLive = live;
      if (isClient) {
        window.dispatchEvent(
          new CustomEvent("api-status-changed", { detail: { isLive: live } })
        );
      }
    }
  }

  public async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${getBaseUrl()}/category/popular-categories`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      const online = res.status < 500;
      this.setLive(online);
      return online;
    } catch {
      this.setLive(false);
      return false;
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (isClient && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${getBaseUrl()}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!res.ok) {
      if (res.status === 401 && isClient) {
        localStorage.removeItem("admin_access_token");
        this.token = null;
      }
      let errorMessage = `HTTP Error ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch {}
      this.setLive(res.status < 500);
      throw new Error(errorMessage);
    }

    const data = await res.json();
    this.setLive(true);
    return data?.data ?? data;
  }

  private async requestFormData<T>(
    path: string,
    payload: Record<string, string>,
    method: string = "POST"
  ): Promise<T> {
    const url = `${getBaseUrl()}${path}`;
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));

    const headers: HeadersInit = {};
    if (isClient && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, { method, body: formData, headers });

    if (!res.ok) {
      if (res.status === 401 && isClient) {
        localStorage.removeItem("admin_access_token");
        this.token = null;
      }
      let errorMessage = `HTTP Error ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch {}
      this.setLive(res.status < 500);
      throw new Error(errorMessage);
    }

    const data = await res.json();
    this.setLive(true);
    return data?.data ?? data;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (isClient) {
      if (token) {
        localStorage.setItem("admin_access_token", token);
        document.cookie = `admin_access_token=${token}; path=/; max-age=${60 * 60 * 24 * 10}; SameSite=Lax`;
      } else {
        localStorage.removeItem("admin_access_token");
        document.cookie = "admin_access_token=; path=/; max-age=0";
      }
    }
  }

  // --- Auth Module ---
  public auth = {
    login: async (email: string, password: string) => {
      const res = await fetch(`${getBaseUrl()}/auth/admin-login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const resUser = await fetch(`${getBaseUrl()}/auth/login`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!resUser.ok) {
          let msg = "Authentication failed";
          try {
            const err = await resUser.json();
            msg = err?.message || err?.error || msg;
          } catch {}
          throw new Error(msg);
        }
        const userData = await resUser.json();
        const userToken =
          userData?.data?.accessToken ??
          userData?.accessToken ??
          null;
        if (!userToken) throw new Error("No access token returned");
        this.setToken(userToken);
        this.setLive(true);
        return { success: true, token: userToken };
      }

      const data = await res.json();
      const token =
        data?.data?.accessToken ??
        data?.accessToken ??
        null;
      if (!token) throw new Error("No access token returned");
      this.setToken(token);
      this.setLive(true);
      return { success: true, token };
    },

    logout: async () => {
      if (isClient && this.token) {
        try {
          await fetch(`${getBaseUrl()}/auth/logout`, {
            method: "POST",
            credentials: "include",
            headers: this.getHeaders(),
          });
        } catch {}
      }
      this.setToken(null);
    },

    // --- Password reset, in three steps ---------------------------------
    // 1. forgetPassword  -> the API emails a one-time code
    // 2. verifyResetCode -> that code is exchanged for a short-lived token
    // 3. resetPassword   -> the token authorises the new password

    /** Ask the API to email a one-time code. */
    forgetPassword: async (email: string) => {
      const res = await fetch(`${getBaseUrl()}/auth/forget-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "Could not send the reset code"));
      }
      return true;
    },

    /** Send it again if the first one never arrived. */
    resendResetCode: async (email: string) => {
      const res = await fetch(`${getBaseUrl()}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          authType: "resetPassword",
        }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "Could not resend the code"));
      }
      return true;
    },

    /**
     * Exchange the emailed code for the reset token.
     *
     * The code is sent as a string: the API validates it with `z.string()`
     * and a number loses any leading zero on the way.
     */
    verifyResetCode: async (email: string, oneTimeCode: string) => {
      const res = await fetch(`${getBaseUrl()}/auth/verify-account`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          oneTimeCode: oneTimeCode.trim(),
        }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "That code was not accepted"));
      }
      const data = await res.json();
      const token = data?.data?.token ?? data?.token ?? null;
      if (!token) {
        throw new Error(
          "The code was accepted but no reset token came back. Please start again.",
        );
      }
      return token as string;
    },

    /** Set the new password. The reset token goes in the Authorization header. */
    resetPassword: async (
      resetToken: string,
      newPassword: string,
      confirmPassword: string,
    ) => {
      const res = await fetch(`${getBaseUrl()}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: resetToken,
        },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "Could not reset the password"));
      }
      return true;
    },
  };

  // --- Tips ---
  public tips = {
    listAll: (params: { page?: number; limit?: number; status?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.page) q.set("page", String(params.page));
      if (params.limit) q.set("limit", String(params.limit));
      if (params.status) q.set("status", params.status);
      return this.request<any>(`/tip/admin/all?${q}`, { method: "GET" });
    },
  };

  // --- Refunds & chargebacks ---
  public refunds = {
    list: (status?: string) =>
      this.request<any>(
        `/refunds/requests${status ? `?status=${status}` : ""}`,
        { method: "GET" },
      ),

    approve: (id: string, body?: { amount?: number; note?: string }) =>
      this.request<any>(`/refunds/requests/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify(body || {}),
      }),

    reject: (id: string, note: string) =>
      this.request<any>(`/refunds/requests/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ note }),
      }),

    listDisputes: () =>
      this.request<any>("/refunds/disputes", { method: "GET" }),
  };

  // --- Dashboard Module (Admin aggregated views) ---
  public dashboard = {
    getOverview: () =>
      this.request<any>("/dashboard/overview", { method: "GET" }),

    getUsers: () =>
      this.request<any>("/dashboard/users", { method: "GET" }),

    getSellerVerifications: () =>
      this.request<any>("/dashboard/seller-verifications", { method: "GET" }),

    getUserSellerApplication: (userId: string) =>
      this.request<{ application: import("@/app/store/slices/sellerVerificationSlice").SellerVerificationRequest | null }>(
        `/dashboard/users/${userId}/seller-application`, { method: "GET" }
      ),

    approveSellerVerification: (userId: string) =>
      this.request<any>(`/dashboard/seller-verifications/${userId}/approve`, { method: "PATCH" }),

    rejectSellerVerification: (userId: string, reason: string) =>
      this.request<any>(`/dashboard/seller-verifications/${userId}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      }),

    getListings: () =>
      this.request<any>("/dashboard/listings", { method: "GET" }),

    getLiveStreams: () =>
      this.request<any>("/dashboard/live-streams", { method: "GET" }),

    getTrades: () =>
      this.request<any>("/dashboard/trades", { method: "GET" }),

    getOrders: () =>
      this.request<any>("/dashboard/orders", { method: "GET" }),

    getDisputes: () =>
      this.request<any>("/dashboard/disputes", { method: "GET" }),

    resolveDispute: (id: string) =>
      this.request<any>(`/dashboard/disputes/${id}/resolve`, { method: "PATCH" }),

    rejectDispute: (id: string, reason: string) =>
      this.request<any>(`/dashboard/disputes/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      }),

    getDisputeChat: (id: string) =>
      this.request<any>(`/dashboard/disputes/${id}/chat`, { method: "GET" }),

    getPayments: () =>
      this.request<any>("/dashboard/payments", { method: "GET" }),

    getBoostedListings: () =>
      this.request<any>("/dashboard/boosted-listings", { method: "GET" }),

    getCategories: () =>
      this.request<any>("/dashboard/categories", { method: "GET" }),

    getNotifications: () =>
      this.request<any>("/dashboard/notifications", { method: "GET" }),

    markNotificationsRead: () =>
      this.request<any>("/dashboard/notifications/mark-all-read", { method: "PATCH" }),

    getReports: (range?: string) =>
      this.request<any>(`/dashboard/reports${range ? `?range=${range}` : ""}`, { method: "GET" }),

    getSettings: () =>
      this.request<any>("/dashboard/settings", { method: "GET" }),

    updateSettings: (settings: any) =>
      this.request<any>("/dashboard/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      }),
  };

  // --- User Management ---
  public users = {
    getAll: () =>
      this.request<any>("/users", { method: "GET" }),

    removeSellerAccess: (userId: string, reason: string) =>
      this.request<void>(`/dashboard/users/${userId}/remove-seller-access`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      }),

    updateStatus: (userId: string, status: string) =>
      this.request<any>(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),

    update: (userId: string, data: { status?: string; verified?: boolean; sellerVerified?: boolean; isCelebrity?: boolean }) =>
      this.request<any>(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (userId: string) =>
      this.request<any>(`/users/${userId}`, { method: "DELETE" }),
  };

  // --- Product / Listing Management ---
  public products = {
    getAll: () =>
      this.request<any>("/products", { method: "GET" }),

    update: (productId: string, data: { isFeatured?: boolean }) =>
      this.request<any>(`/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (productId: string) =>
      this.request<any>(`/products/${productId}`, { method: "DELETE" }),
  };

  // --- Support / Disputes ---
  public support = {
    getAll: () =>
      this.request<any>("/support", { method: "GET" }),

    updateStatus: (supportId: string, status: string, feedback: string) =>
      this.request<any>(`/support/${supportId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, feedback }),
      }),
  };

  // --- Categories ---
  public categories = {
    // The API pages at 10 by default, which hid most categories and
    // every subcategory from the admin.
    getAll: () =>
      this.request<any>("/category?limit=500", { method: "GET" }),

    create: (name: string, description: string, parent?: string) =>
      this.request<any>("/category", {
        method: "POST",
        body: JSON.stringify(
          parent
            ? { name, description, parent, type: "subcategory" }
            : { name, description },
        ),
      }),

    update: (categoryId: string, data: Record<string, any>) =>
      this.request<any>(`/category/${categoryId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (categoryId: string) =>
      this.request<any>(`/category/${categoryId}`, { method: "DELETE" }),
  };

  // --- Notifications ---
  public notifications = {
    create: (title: string, text: string, receiverId?: string) =>
      this.request<any>("/notifications", {
        method: "POST",
        body: JSON.stringify({ title, text, receiver: receiverId }),
      }),

    markRead: (id: string) =>
      this.request<any>(`/notifications/${id}/read`, { method: "PATCH" }),

    markAllRead: () =>
      this.request<any>("/notifications/read-all", { method: "PATCH" }),

    delete: (id: string) =>
      this.request<any>(`/notifications/${id}`, { method: "DELETE" }),
  };

  // --- Trades ---
  public trades = {
    decline: (tradeOfferId: string) =>
      this.request<any>(`/trades/decline/${tradeOfferId}`, { method: "POST" }),

    // Trades through ARIES: receive, authenticate, ship back, close out.
    list: (params: { stage?: string; search?: string } = {}) => {
      const q = new URLSearchParams({ limit: "100" });
      if (params.stage) q.set("stage", params.stage);
      if (params.search) q.set("search", params.search);
      return this.request<any[]>(`/trades/admin/list?${q}`, { method: "GET" });
    },
    get: (id: string) => this.request<any>(`/trades/${id}`, { method: "GET" }),
    receive: (id: string, party: "sender" | "receiver") =>
      this.request<any>(`/trades/admin/${id}/receive`, {
        method: "POST",
        body: JSON.stringify({ party }),
      }),
    authenticate: (id: string, party: "sender" | "receiver", passed: boolean, note?: string) =>
      this.request<any>(`/trades/admin/${id}/authenticate`, {
        method: "POST",
        body: JSON.stringify({ party, passed, note }),
      }),
    shipBack: (id: string) =>
      this.request<any>(`/trades/admin/${id}/ship-back`, { method: "POST" }),
    retryLabels: (id: string) =>
      this.request<any>(`/trades/admin/${id}/retry-labels`, { method: "POST" }),
    complete: (id: string) =>
      this.request<any>(`/trades/admin/${id}/complete`, { method: "POST" }),
    cancel: (
      id: string,
      body: { faultParty?: "sender" | "receiver" | "both"; reason: string; dryRun?: boolean }
    ) =>
      this.request<any>(`/trades/admin/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  };

  // --- Orders / Payments ---
  public orders = {
    refund: (paymentId: string) =>
      this.request<any>(`/payment/${paymentId}/refund`, { method: "POST" }),
  };

  // --- Chat ---
  public chat = {
    createRoom: (userId: string) =>
      this.request<any>(`/chat/${userId}`, { method: "POST" }),
    getRooms: () =>
      this.request<any>("/chat", { method: "GET" }),
  };

  // --- Auctions / Live Stream ---
  public auctions = {
    adminOverview: (streamId: string) =>
      this.request<any>(`/auctions/admin/stream/${streamId}/overview`, { method: "GET" }),
    getStreams: (status?: string) =>
      this.request<any>(`/auctions/streams${status ? `?status=${status}` : ""}`, { method: "GET" }),
    getAgoraToken: (channelName: string, role: string = "subscriber", uid: number = 0) =>
      this.request<any>(
        `/auctions/token?channelName=${encodeURIComponent(channelName)}&role=${role}&uid=${uid}`,
        { method: "GET" }
      ),
  };

  // --- Messaging ---
  public messages = {
    getByChatId: (chatId: string) =>
      this.request<any>(`/message/${chatId}`, { method: "GET" }),

    send: (chatId: string, text: string) =>
      this.requestFormData<any>("/message", { chatId, text }),
  };

  // --- Legal / Public Documents ---
  public legal = {
    get: (type: LegalDocType) =>
      this.request<any>(`/public/${type}`, { method: "GET" }),
    update: (type: LegalDocType, content: string) =>
      this.request<any>("/public", {
        method: "POST",
        body: JSON.stringify({ type, content }),
      }),
  };

  // --- Partners & Affiliates ---
  public partners = {
    create: (data: {
      name: string;
      email: string;
      promoCode: string;
      revenueSharePercentage?: number;
    }) =>
      this.request<any>("/partner/create", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getAll: () =>
      this.request<any>("/partner/all", { method: "GET" }),
    requestOTP: (token: string) =>
      this.request<any>("/partner/request-otp", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    verifyOTP: (token: string, otp: string) =>
      this.request<any>("/partner/verify-otp", {
        method: "POST",
        body: JSON.stringify({ token, otp }),
      }),
    getDashboard: (token: string, otpToken?: string) =>
      this.request<any>(
        `/partner/dashboard?token=${encodeURIComponent(token)}${
          otpToken ? `&otpToken=${encodeURIComponent(otpToken)}` : ""
        }`,
        {
          method: "GET",
        }
      ),
    sendEmail: (partnerId: string) =>
      this.request<any>(`/partner/${partnerId}/send-email`, { method: "POST" }),
    updateBankDetails: (
      token: string,
      data: {
        accountNumber: string;
        routingNumber?: string;
        bankName?: string;
        accountHolderName?: string;
      }
    ) =>
      this.request<any>(`/partner/bank-details?token=${encodeURIComponent(token)}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  };

  // --- Giveaway Management ---
  public giveaway = {
    getConfig: () =>
      this.request<any>("/giveaway/config", { method: "GET" }),
    updateConfig: (data: Record<string, any>) =>
      this.request<any>("/giveaway/config", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    getParticipants: (page: number = 1, limit: number = 20, search: string = "") =>
      this.request<any>(
        `/giveaway/participants?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
        { method: "GET" }
      ),
    getWinners: () =>
      this.request<any>("/giveaway/winners", { method: "GET" }),
    getRandomPool: (count: number = 100) =>
      this.request<any>(`/giveaway/random-pool?count=${count}`, { method: "GET" }),
    drawWinner: (userId: string, prizeName?: string, notes?: string) =>
      this.request<any>("/giveaway/draw-winner", {
        method: "POST",
        body: JSON.stringify({ userId, prizeName, notes }),
      }),
  };

  // --- Upload Management ---
  public upload = {
    image: async (file: File): Promise<{ success: boolean; data?: { url: string }; message?: string }> => {
      const formData = new FormData();
      formData.append("image", file);

      const headers: HeadersInit = {};
      const token = isClient ? localStorage.getItem("admin_access_token") : null;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${getBaseUrl()}/upload/image`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to upload image");
      }

      return await res.json();
    },
  };
}

export const api = new ApiClient();

import { useState, useEffect } from "react";

/** Legal documents the admin can publish; each one has a public page. */
export type LegalDocType =
  | "privacy-policy"
  | "terms-and-condition"
  | "seller-policy"
  | "marketplace-rules";

export function useApiStatus() {
  const [isLive, setIsLive] = useState(api.isLive);

  useEffect(() => {
    if (!isClient) return;
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsLive(customEvent.detail.isLive);
    };
    window.addEventListener("api-status-changed", handler);
    return () => window.removeEventListener("api-status-changed", handler);
  }, []);

  return isLive;
}
