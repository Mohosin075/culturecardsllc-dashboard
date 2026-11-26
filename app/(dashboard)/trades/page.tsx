"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Search, Loader2, X, ExternalLink, ArrowLeftRight } from "lucide-react";
import { api } from "@/app/lib/api";
import { useAlert } from "@/app/context/AlertContext";
import ErrorState from "@/app/components/ErrorState";

/**
 * Trades through ARIES. Every accepted trade moves:
 * payment → items shipped to ARIES → authenticated → shipped back → complete.
 * This page is where ARIES receives and checks items, buys the return labels,
 * and closes or cancels a trade (with the client's refund rules applied).
 */

type Party = "sender" | "receiver";

const STAGES: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "awaiting_payment", label: "Payment due" },
  { key: "awaiting_shipment", label: "Ship to ARIES" },
  { key: "in_authentication", label: "Authenticating" },
  { key: "shipping_back", label: "Shipping back" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  STAGES.filter((s) => s.key).map((s) => [s.key, s.label])
);

const STAGE_STYLE: Record<string, string> = {
  awaiting_payment: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  awaiting_shipment: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_authentication: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  shipping_back: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const ITEM_STATUS_LABEL: Record<string, string> = {
  none: "Sends nothing",
  awaiting_shipment: "Not shipped yet",
  in_transit: "On the way to ARIES",
  received: "Received — check it",
  authenticated: "Authenticated",
  failed: "Failed authentication",
  returned: "Returned to owner",
};

const money = (n: unknown) => `$${Number(n || 0).toFixed(2)}`;
const nameOf = (u: any) => u?.fullName || u?.name || u?.email || "Trader";
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

function StageBadge({ stage }: { stage?: string }) {
  const key = stage || "pending";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STAGE_STYLE[key] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
      {STAGE_LABEL[key] || key}
    </span>
  );
}

export default function TradesPage() {
  const { showAlert, showConfirm } = useAlert();
  const [stage, setStage] = useState("");
  const [search, setSearch] = useState("");
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.trades.list({ stage: stage || undefined, search: search.trim() || undefined });
      setTrades(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load trades");
    } finally {
      setLoading(false);
    }
  }, [stage, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Trades</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Accepted trades travel through ARIES for authentication before the items reach the other trader.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((s) => (
            <button
              key={s.key || "all"}
              onClick={() => setStage(s.key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                stage === s.key ? "bg-[#155DFC] text-white" : "bg-[#111111] text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative md:ml-auto md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Trade code, e.g. A-12"
            className="w-full bg-[#111111] border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-[#155DFC]"
          />
        </div>
      </div>

      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500 text-sm">
                <th className="px-6 py-4 font-medium">Trade</th>
                <th className="px-6 py-4 font-medium">Sender → Receiver</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium">Cash</th>
                <th className="px-6 py-4 font-medium">Stage</th>
                <th className="px-6 py-4 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin text-[#155DFC] inline" size={28} />
                  </td>
                </tr>
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No trades here.</td>
                </tr>
              ) : (
                trades.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => setOpenId(t._id)}
                    className="text-zinc-300 hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-sm text-white">{t.tradeCode || "—"}</td>
                    <td className="px-6 py-4 text-sm">
                      {nameOf(t.senderId)} <span className="text-zinc-600">→</span> {nameOf(t.receiverId)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center gap-2">
                        {t.senderProductIds?.length || 0}
                        <ArrowLeftRight size={12} className="text-zinc-500" />
                        {t.receiverProductIds?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{t.cashSupplement ? money(Math.abs(t.cashSupplement)) : "—"}</td>
                    <td className="px-6 py-4"><StageBadge stage={t.stage || t.status} /></td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{fmtDate(t.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openId && (
        <TradeDrawer
          id={openId}
          onClose={() => setOpenId(null)}
          onChanged={load}
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      )}
    </div>
  );
}

function TradeDrawer({
  id,
  onClose,
  onChanged,
  showAlert,
  showConfirm,
}: {
  id: string;
  onClose: () => void;
  onChanged: () => void;
  showAlert: (m: string, t?: any) => void;
  showConfirm: (m: string, ok: () => void, title?: string) => void;
}) {
  const [trade, setTrade] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setTrade(await api.trades.get(id));
    } catch (e: any) {
      showAlert(e?.message || "Could not load trade", "error");
    }
  }, [id, showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action: () => Promise<any>, done: string) => {
    setBusy(true);
    try {
      const result = await action();
      setTrade(result?.trade ?? result);
      showAlert(done, "success");
      onChanged();
    } catch (e: any) {
      showAlert(e?.message || "Action failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const active = trade && trade.status === "accepted" && trade.stage !== "awaiting_payment";
  const ready = (s?: string) => s === "authenticated" || s === "none";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-full overflow-y-auto bg-[#0c0c0c] border-l border-white/10 p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Trade {trade?.tradeCode || ""}</h2>
            {trade && (
              <p className="text-zinc-500 text-sm mt-1">
                Accepted {fmtDate(trade.acceptedAt)}
                {trade.paymentDueAt && trade.stage === "awaiting_payment" ? ` · payment due ${fmtDate(trade.paymentDueAt)}` : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {trade && <StageBadge stage={trade.stage || trade.status} />}
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white cursor-pointer" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {!trade ? (
          <Loader2 className="animate-spin text-[#155DFC]" size={28} />
        ) : (
          <>
            {trade.cancelReason && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-300">
                Cancelled: {trade.cancelReason}
                {trade.faultParty ? ` (at fault: ${trade.faultParty})` : ""}
              </div>
            )}

            {(["sender", "receiver"] as Party[]).map((party) => (
              <SideCard
                key={party}
                party={party}
                trade={trade}
                busy={busy}
                canAct={!!active}
                onReceive={() => run(() => api.trades.receive(id, party), "Marked as received.")}
                onPass={() =>
                  showConfirm(`Mark the ${party}'s item(s) as authentic?`, () =>
                    run(() => api.trades.authenticate(id, party, true), "Authenticated.")
                  , "Pass authentication")
                }
                onFail={() =>
                  showConfirm(
                    `Mark the ${party}'s item(s) as failed? Both traders are told, and you can then cancel the trade with this side at fault.`,
                    () => run(() => api.trades.authenticate(id, party, false), "Marked as failed."),
                    "Fail authentication"
                  )
                }
              />
            ))}

            <div className="flex flex-wrap gap-3">
              {trade.stage === "awaiting_shipment" && !trade.labelsIssuedAt && (
                <ActionButton busy={busy} onClick={() => run(() => api.trades.retryLabels(id), "Labels checked.")}>
                  Retry inbound labels
                </ActionButton>
              )}
              {trade.stage === "in_authentication" && ready(trade.senderItemStatus) && ready(trade.receiverItemStatus) && (
                <ActionButton busy={busy} onClick={() => run(() => api.trades.shipBack(id), "Return labels bought.")}>
                  Buy labels back to traders
                </ActionButton>
              )}
              {trade.stage === "shipping_back" && (
                <ActionButton
                  busy={busy}
                  onClick={() =>
                    showConfirm(
                      "Complete this trade now? Ownership moves to the new owners and any cash difference is paid out. Normally this happens on its own when tracking shows delivery.",
                      () => run(() => api.trades.complete(id), "Trade completed."),
                      "Complete trade"
                    )
                  }
                >
                  Complete trade
                </ActionButton>
              )}
              {trade.status === "accepted" && (
                <ActionButton busy={busy} tone="danger" onClick={() => setCancelOpen(true)}>
                  Cancel &amp; refund…
                </ActionButton>
              )}
            </div>

            {cancelOpen && (
              <CancelPanel
                id={id}
                onClose={() => setCancelOpen(false)}
                onDone={(t) => {
                  setTrade(t);
                  setCancelOpen(false);
                  onChanged();
                  showAlert("Trade cancelled and refunds issued.", "success");
                }}
                showAlert={showAlert}
              />
            )}

            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">History</h3>
              <ol className="space-y-2">
                {[...(trade.history || [])].reverse().map((h: any, i: number) => (
                  <li key={i} className="text-sm text-zinc-300 flex gap-3">
                    <span className="text-zinc-600 shrink-0 w-28">{fmtDate(h.at)}</span>
                    <span>{h.message}</span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  busy,
  tone = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  tone?: "primary" | "danger";
}) {
  return (
    <button
      disabled={busy}
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
        tone === "danger"
          ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
          : "bg-[#155DFC] text-white hover:bg-[#155DFC]/90"
      }`}
    >
      {children}
    </button>
  );
}

function SideCard({
  party,
  trade,
  busy,
  canAct,
  onReceive,
  onPass,
  onFail,
}: {
  party: Party;
  trade: any;
  busy: boolean;
  canAct: boolean;
  onReceive: () => void;
  onPass: () => void;
  onFail: () => void;
}) {
  const user = party === "sender" ? trade.senderId : trade.receiverId;
  const items: any[] = (party === "sender" ? trade.senderProductIds : trade.receiverProductIds) || [];
  const itemStatus: string = trade[party === "sender" ? "senderItemStatus" : "receiverItemStatus"] || "";
  const pay = trade.settlement?.parties?.find((p: any) => p.role === party);
  const cash = party === "sender" ? Math.max(0, trade.cashSupplement || 0) : Math.max(0, -(trade.cashSupplement || 0));
  const shipments = (trade.shipments || []).filter((s: any) => s.party === party && s.status !== "quoted");

  return (
    <div className="p-5 rounded-2xl border border-white/5 bg-[#111111] space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider">{party}</span>
          <div className="text-white font-semibold">{nameOf(user)}</div>
        </div>
        <span className="text-sm text-zinc-300">{ITEM_STATUS_LABEL[itemStatus] || "—"}</span>
      </div>

      <ul className="space-y-1.5">
        {items.map((p) => (
          <li key={p._id} className="flex justify-between text-sm">
            <span className="text-zinc-200">{p.title}</span>
            <span className="text-zinc-500">{money(p.estValue)}</span>
          </li>
        ))}
        {cash > 0 && (
          <li className="flex justify-between text-sm">
            <span className="text-zinc-200">Cash</span>
            <span className="text-zinc-500">{money(cash)}</span>
          </li>
        )}
      </ul>

      {pay && (
        <div className="text-xs text-zinc-400 grid grid-cols-2 gap-x-6 gap-y-1 p-3 rounded-xl bg-black/40">
          <span>Payment</span>
          <span className={pay.status === "paid" ? "text-green-500" : "text-yellow-400"}>{pay.status}</span>
          <span>Fee (4%)</span>
          <span>{money(pay.feeNet)}{pay.feeForfeited ? " (kept)" : ""}</span>
          <span>Material + labels</span>
          <span>{money(pay.materialFee + pay.inboundLabel + pay.outboundLabel)}</span>
          <span>Charged</span>
          <span>{money(pay.totalAmount)}</span>
          {pay.refundedAmount > 0 && (
            <>
              <span>Refunded</span>
              <span>{money(pay.refundedAmount)}</span>
            </>
          )}
          {pay.extraDue > 0 && (
            <>
              <span>Still owes</span>
              <span className="text-orange-400">{money(pay.extraDue)}</span>
            </>
          )}
        </div>
      )}

      {shipments.length > 0 && (
        <ul className="space-y-1.5">
          {shipments.map((s: any) => (
            <li key={s._id} className="flex items-center justify-between text-xs text-zinc-400">
              <span>
                {s.leg === "inbound" ? "To ARIES" : s.leg === "outbound" ? "Back to trader" : "Return"} · {s.trackingCode || "—"} ·{" "}
                {s.status}
              </span>
              {s.labelUrl && (
                <a href={s.labelUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#6E9BFF] hover:underline">
                  Label <ExternalLink size={12} />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {canAct && (
        <div className="flex gap-2">
          {(itemStatus === "awaiting_shipment" || itemStatus === "in_transit") && (
            <ActionButton busy={busy} onClick={onReceive}>Mark received</ActionButton>
          )}
          {(itemStatus === "received" || itemStatus === "failed") && (
            <>
              <ActionButton busy={busy} onClick={onPass}>Pass</ActionButton>
              {itemStatus !== "failed" && (
                <ActionButton busy={busy} tone="danger" onClick={onFail}>Fail</ActionButton>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CancelPanel({
  id,
  onClose,
  onDone,
  showAlert,
}: {
  id: string;
  onClose: () => void;
  onDone: (trade: any) => void;
  showAlert: (m: string, t?: any) => void;
}) {
  const [fault, setFault] = useState<"" | Party | "both">("");
  const [reason, setReason] = useState("");
  const [plan, setPlan] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const body = () => ({ faultParty: fault || undefined, reason: reason.trim() });

  const preview = async () => {
    if (reason.trim().length < 3) return showAlert("Write a short reason first.", "error");
    setBusy(true);
    try {
      const res = await api.trades.cancel(id, { ...body(), dryRun: true });
      setPlan(res.plan);
    } catch (e: any) {
      showAlert(e?.message || "Preview failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const res = await api.trades.cancel(id, body());
      onDone(res.trade);
    } catch (e: any) {
      showAlert(e?.message || "Cancel failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/[0.03] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Cancel this trade</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-white cursor-pointer" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <p className="text-xs text-zinc-400">
        The side at fault keeps no 4% fee and pays the return shipping. The other side gets everything back. With no side at
        fault, everyone is refunded and each pays their own return.
      </p>
      <div className="flex flex-wrap gap-2">
        {(["", "sender", "receiver", "both"] as const).map((f) => (
          <button
            key={f || "none"}
            onClick={() => {
              setFault(f);
              setPlan(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              fault === f ? "bg-red-500 text-white" : "bg-black/40 text-zinc-400 border border-white/5"
            }`}
          >
            {f ? `${f} at fault` : "No fault"}
          </button>
        ))}
      </div>
      <input
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
          setPlan(null);
        }}
        placeholder="Reason (shown to both traders)"
        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-zinc-200 focus:outline-none focus:border-red-500/50"
      />

      {plan && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-xs">
              <th className="text-left py-1">Side</th>
              <th className="text-right py-1">Paid</th>
              <th className="text-right py-1">Return shipping</th>
              <th className="text-right py-1">Refund</th>
            </tr>
          </thead>
          <tbody>
            {plan.parties.map((p: any) => (
              <tr key={p.role} className="text-zinc-300">
                <td className="py-1">
                  {p.role}
                  {p.feeForfeited ? <span className="text-red-400"> · keeps no fee</span> : null}
                </td>
                <td className="text-right">{money(p.paidAmount)}</td>
                <td className="text-right">{money(p.returnShipping)}</td>
                <td className="text-right text-white">
                  {money(p.refundAmount)}
                  {p.shortfall > 0 ? <span className="text-orange-400"> (short {money(p.shortfall)})</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex gap-2">
        <ActionButton busy={busy} onClick={preview}>Preview refunds</ActionButton>
        {plan && (
          <ActionButton busy={busy} tone="danger" onClick={confirm}>
            Cancel and refund
          </ActionButton>
        )}
      </div>
    </div>
  );
}
