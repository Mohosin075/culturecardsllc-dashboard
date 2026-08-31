"use client";

// Check if window is defined (Next.js SSR safety)
const isClient = typeof window !== "undefined";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5007/api/v1";

class ApiClient {
  public isLive = false;
  private token: string | null = null;

  constructor() {
    if (isClient) {
      this.token = localStorage.getItem("admin_access_token");
      // Initial background ping check
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
      const res = await fetch(`${BASE_URL}/category/popular-categories`, {
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

  /**
   * Core request method — throws on failure, no mock fallback.
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!res.ok) {
      // If unauthenticated, clear token
      if (res.status === 401 && isClient) {
        localStorage.removeItem("admin_access_token");
        this.token = null;
      }
      let errorMessage = `HTTP Error ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch {
        // ignore JSON parse error
      }
      this.setLive(res.status < 500);
      throw new Error(errorMessage);
    }

    const data = await res.json();
    this.setLive(true);
    return data?.data ?? data;
  }

  /**
   * Send multipart/form-data request — needed for endpoints using multer middleware.
   * Wraps payload as JSON string in the `data` field so multer can parse it via req.body.data.
   */
  private async requestFormData<T>(
    path: string,
    payload: Record<string, string>,
    method: string = "POST"
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));

    const headers: HeadersInit = {};
    if (isClient && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    // Note: Do NOT set Content-Type — browser sets it automatically with boundary for multipart

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
        // Also save to cookie so Next.js middleware can read it for route guarding
        document.cookie = `admin_access_token=${token}; path=/; max-age=${60 * 60 * 24 * 10}; SameSite=Lax`;
      } else {
        localStorage.removeItem("admin_access_token");
        // Clear cookie
        document.cookie = "admin_access_token=; path=/; max-age=0";
      }
    }
  }

  // --- Auth Module ---
  public auth = {
    login: async (email: string, password: string) => {
      // Try admin login first
      const res = await fetch(`${BASE_URL}/auth/admin-login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        // Try regular login as fallback
        const resUser = await fetch(`${BASE_URL}/auth/login`, {
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
          } catch { /* ignore */ }
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
          await fetch(`${BASE_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
            headers: this.getHeaders(),
          });
        } catch { /* ignore logout errors */ }
      }
      this.setToken(null);
    },
  };

  // --- Dashboard Module (Admin aggregated views) ---
  public dashboard = {
    getOverview: () =>
      this.request<any>("/dashboard/overview", { method: "GET" }),

    getUsers: () =>
      this.request<any>("/dashboard/users", { method: "GET" }),

    getSellerVerifications: () =>
      this.request<any>("/dashboard/seller-verifications", { method: "GET" }),

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

    updateStatus: (userId: string, status: string) =>
      this.request<any>(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),

    update: (userId: string, data: { status?: string; verified?: boolean }) =>
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
    getAll: () =>
      this.request<any>("/category", { method: "GET" }),

    create: (name: string, description: string) =>
      this.request<any>("/category", {
        method: "POST",
        body: JSON.stringify({ name, description }),
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
  };

  // --- Orders / Payments ---
  public orders = {
    /**
     * Refund an order via payment refund endpoint.
     * Pass the paymentId (from order data) if available, else orderId as fallback.
     */
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

  // --- Messaging ---
  public messages = {
    getByChatId: (chatId: string) =>
      this.request<any>(`/message/${chatId}`, { method: "GET" }),

    /**
     * Send a message via multipart FormData — required because the /message
     * endpoint uses multer middleware which reads body from req.body.data (JSON string).
     */
    send: (chatId: string, text: string) =>
      this.requestFormData<any>("/message", { chatId, text }),
  };
}

export const api = new ApiClient();

// React hook to detect live/offline status in UI components
import { useState, useEffect } from "react";

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
