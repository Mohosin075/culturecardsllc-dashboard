"use client";

import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { api } from "@/app/lib/api";

interface ShowOverviewModalProps {
  streamId: string | null;
  title?: string;
  onClose: () => void;
}

const money = (n?: number) => `$${(n ?? 0).toFixed(2)}`;
const personName = (p: any) => p?.fullName || p?.name || "Unknown";

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="text-sm font-bold text-zinc-200">
        {title} <span className="text-zinc-500 font-medium">({count})</span>
      </h4>
      {count === 0 ? <p className="text-xs text-zinc-500">Nothing yet.</p> : children}
    </section>
  );
}

export default function ShowOverviewModal({ streamId, title, onClose }: ShowOverviewModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamId) return;
    let cancelled = false;
    setData(null);
    setError(null);
    setLoading(true);
    api.auctions
      .adminOverview(streamId)
      .then((res: any) => !cancelled && setData(res))
      .catch((e: any) => !cancelled && setError(e?.message || "Failed to load show"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [streamId]);

  if (!streamId) return null;

  const m = data?.metrics;
  const stats = m
    ? [
        ["Inventory", m.inventoryCount],
        ["Auctions", m.auctionItems],
        ["Orders", m.orders],
        ["Revenue", money(m.revenue)],
        ["Giveaways", m.giveaways],
        ["Spin prizes", m.spinPrizes],
        ["Tips", `${m.tips} · ${money(m.tipTotal)}`],
      ]
    : [];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#121215] border border-white/10 rounded-3xl shadow-2xl p-6 space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-4">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-white truncate">{data?.stream?.title || title || "Show"}</h3>
            {data && (
              <p className="text-xs text-zinc-500 mt-1">
                Host {personName(data.stream.host)} · {data.stream.status} · {data.stream.viewersCount} viewers
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 shrink-0 rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="animate-spin text-[#155DFC]" size={28} />
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map(([label, value]) => (
                <div key={String(label)} className="bg-black/30 border border-white/5 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
                  <div className="text-base font-bold text-white font-mono mt-0.5">{value}</div>
                </div>
              ))}
            </div>

            <Section title="Inventory" count={data.inventory.length}>
              <ul className="divide-y divide-white/5 text-sm text-zinc-300">
                {data.inventory.map((p: any) => (
                  <li key={p._id} className="py-2 flex justify-between gap-4">
                    <span className="truncate">{p.title}</span>
                    <span className="text-zinc-500 shrink-0">
                      {p.isGiveaway ? "Giveaway · " : ""}
                      {p.status}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Auctioned items" count={data.auctionItems.length}>
              <ul className="divide-y divide-white/5 text-sm text-zinc-300">
                {data.auctionItems.map((a: any) => (
                  <li key={a._id} className="py-2 flex justify-between gap-4">
                    <span className="truncate">{a.productId?.title || "Item"}</span>
                    <span className="text-zinc-500 shrink-0">
                      {money(a.currentBid)}
                      {a.highestBidderId ? ` · ${personName(a.highestBidderId)}` : " · no bids"}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Giveaway winners" count={data.giveaways.length}>
              <ul className="divide-y divide-white/5 text-sm text-zinc-300">
                {data.giveaways.map((o: any) => (
                  <li key={o._id} className="py-2 flex justify-between gap-4">
                    <span className="truncate">{o.product?.title || "Prize"}</span>
                    <span className="text-zinc-500 shrink-0">
                      {personName(o.buyer)} · {o.deliveryStatus}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Spin wheel prizes" count={data.spinPrizes.length}>
              <ul className="divide-y divide-white/5 text-sm text-zinc-300">
                {data.spinPrizes.map((o: any) => (
                  <li key={o._id} className="py-2 flex justify-between gap-4">
                    <span className="truncate">{String(o.spinWheelPrize)}</span>
                    <span className="text-zinc-500 shrink-0">{personName(o.buyer)}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Tips" count={data.tips.length}>
              <ul className="divide-y divide-white/5 text-sm text-zinc-300">
                {data.tips.map((t: any) => (
                  <li key={t._id} className="py-2 flex justify-between gap-4">
                    <span className="truncate">
                      {t.senderName}
                      {t.message ? ` — ${t.message}` : ""}
                    </span>
                    <span className="text-zinc-500 shrink-0 font-mono">{money(t.amount)}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
