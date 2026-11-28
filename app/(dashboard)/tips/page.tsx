"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, HandCoins } from "lucide-react";
import { api } from "@/app/lib/api";
import ErrorState from "@/app/components/ErrorState";
import Pagination from "@/app/components/Pagination";

interface TipRow {
  _id: string;
  amount: number;
  platformFee?: number;
  processingFee?: number;
  sellerNetAmount?: number;
  totalCharged?: number;
  status: "pending" | "succeeded" | "failed";
  senderName: string;
  message?: string;
  createdAt: string;
  streamId?: { _id: string; title?: string } | null;
  sellerId?: { _id: string; name?: string; email?: string } | null;
}

interface TipsResponse {
  summary: {
    count: number;
    tipped: number;
    platformFees: number;
    processingFees: number;
    sellerNet: number;
  };
  meta: { page: number; limit: number; total: number; totalPages: number };
  tips: TipRow[];
}

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Succeeded", value: "succeeded" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
];

const STATUS_STYLE: Record<string, string> = {
  succeeded: "bg-emerald-500/10 text-emerald-400",
  pending: "bg-amber-500/10 text-amber-400",
  failed: "bg-red-500/10 text-red-400",
};

const money = (n?: number) => `$${(n ?? 0).toFixed(2)}`;

export default function TipsPage() {
  const [data, setData] = useState<TipsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.tips.listAll({ page, limit: rowsPerPage, status });
      setData(res as TipsResponse);
    } catch (e: any) {
      setError(e?.message || "Failed to load tips");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, status]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;

  const summary = data?.summary;
  const cards = [
    { label: "Tips received", value: String(summary?.count ?? 0) },
    { label: "Total tipped", value: money(summary?.tipped) },
    { label: "Platform fees", value: money(summary?.platformFees) },
    { label: "Paid to sellers", value: money(summary?.sellerNet) },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Tips</h1>
        <p className="text-zinc-500 text-sm mt-1.5">
          Every tip viewers have sent to hosts during live shows. Totals count succeeded tips only.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#121214]/40 border border-white/5 rounded-2xl p-5 space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{c.label}</span>
            <p className="text-2xl font-bold text-white font-mono">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              status === f.value
                ? "bg-[#155DFC] border-[#155DFC] text-white"
                : "bg-[#121214]/60 border-white/5 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="animate-spin text-[#155DFC]" size={32} />
        </div>
      ) : !data || data.tips.length === 0 ? (
        <div className="bg-[#121214]/20 border border-white/5 rounded-3xl p-16 text-center space-y-3">
          <HandCoins className="mx-auto text-zinc-600" size={28} />
          <p className="text-zinc-400 text-sm">No tips match this filter yet.</p>
        </div>
      ) : (
        <div className="bg-[#121214]/40 border border-white/5 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase tracking-wider text-zinc-500 border-b border-white/5">
              <tr>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">From</th>
                <th className="px-5 py-4">Host</th>
                <th className="px-5 py-4">Show</th>
                <th className="px-5 py-4 text-right">Tip</th>
                <th className="px-5 py-4 text-right">Platform fee</th>
                <th className="px-5 py-4 text-right">Host receives</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {data.tips.map((t) => (
                <tr key={t._id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-4 whitespace-nowrap text-zinc-400">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-zinc-200">{t.senderName}</div>
                    {t.message && (
                      <div className="text-xs text-zinc-500 max-w-[220px] truncate" title={t.message}>
                        {t.message}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div>{t.sellerId?.name || "Unknown"}</div>
                    <div className="text-xs text-zinc-500">{t.sellerId?.email}</div>
                  </td>
                  <td className="px-5 py-4 max-w-[200px] truncate">{t.streamId?.title || "Deleted show"}</td>
                  <td className="px-5 py-4 text-right font-mono">{money(t.amount)}</td>
                  <td className="px-5 py-4 text-right font-mono text-zinc-400">{money(t.platformFee)}</td>
                  <td className="px-5 py-4 text-right font-mono">{money(t.sellerNetAmount)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        STATUS_STYLE[t.status] || "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t border-white/5">
            <Pagination
              currentPage={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(n) => {
                setRowsPerPage(n);
                setPage(1);
              }}
              totalItems={data.meta.total}
              itemNamePlural="tips"
            />
          </div>
        </div>
      )}
    </div>
  );
}
