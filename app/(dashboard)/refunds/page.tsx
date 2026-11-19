"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Loader2, Undo2, Image as ImageIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import {
  fetchRefundRequests,
  approveRefund,
  rejectRefund,
  RefundRequestItem,
} from "@/app/store/slices/refundsSlice";
import { useAlert } from "@/app/context/AlertContext";
import ErrorState from "@/app/components/ErrorState";

const REASON_LABELS: Record<string, string> = {
  item_not_received: "Item not received",
  not_as_described: "Not as described",
  damaged: "Arrived damaged",
  wrong_item: "Wrong item sent",
  other: "Other",
};

const money = (value?: number | null) =>
  typeof value === "number" ? `$${value.toFixed(2)}` : "—";

export default function RefundsPage() {
  const dispatch = useAppDispatch();
  const { items: requests, loading, error } = useAppSelector(
    (state) => state.refunds
  );
  const { showAlert, showConfirm, showPrompt } = useAlert();

  useEffect(() => {
    dispatch(fetchRefundRequests("pending"));
  }, [dispatch]);

  const handleApprove = (request: RefundRequestItem) => {
    showConfirm(
      `Refund ${money(request.requestedAmount)} to ${request.buyer.name}? ` +
        `Stripe takes this out of ${request.seller.name}'s balance and it cannot be undone.`,
      async () => {
        try {
          await dispatch(approveRefund({ id: request.id })).unwrap();
          showAlert("Refund approved and sent to Stripe.", "success");
        } catch (err: any) {
          showAlert(err?.message || "Failed to approve the refund.", "error");
        }
      },
      "Approve Refund"
    );
  };

  const handleReject = (request: RefundRequestItem) => {
    showPrompt(
      "Reject Refund Request",
      "Tell the buyer why (they will see this)",
      async (note) => {
        try {
          await dispatch(rejectRefund({ id: request.id, note })).unwrap();
          showAlert("Refund request rejected.", "info");
        } catch (err: any) {
          showAlert(err?.message || "Failed to reject the request.", "error");
        }
      },
      "Item was delivered as described"
    );
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#155DFC]" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => dispatch(fetchRefundRequests("pending"))}
      />
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-semibold text-white">Refund Requests</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Approving a refund reverses the charge on the seller&apos;s Stripe
          account. The money comes out of their balance, not ARIES&apos;s.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-[#111111] border border-white/5 rounded-3xl text-center space-y-4 max-w-xl mx-auto mt-12">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
            <Undo2 size={28} className="text-green-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">Nothing to review</h3>
            <p className="text-zinc-500 text-sm max-w-sm">
              There are no refund requests waiting for a decision.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.map((request: RefundRequestItem) => {
            const isPartial =
              typeof request.orderTotal === "number" &&
              request.requestedAmount < request.orderTotal - 0.005;

            return (
              <div
                key={request.id}
                className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-6 flex flex-col"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-100">
                      {money(request.requestedAmount)}
                      {isPartial ? (
                        <span className="ml-2 text-xs font-semibold text-amber-400 uppercase tracking-wide">
                          Partial
                        </span>
                      ) : null}
                    </h2>
                    <p className="text-sm text-zinc-500">
                      of {money(request.orderTotal)} order total
                    </p>
                  </div>
                  <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-yellow-500/20">
                    {request.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-zinc-500 shrink-0">Buyer:</span>
                    <span className="text-zinc-300 text-right">
                      {request.buyer.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-zinc-500 shrink-0">Seller:</span>
                    <span className="text-zinc-300 text-right">
                      {request.seller.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-zinc-500 shrink-0">Delivery:</span>
                    <span className="text-zinc-300 text-right">
                      {request.deliveryStatus || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-zinc-500 shrink-0">Reason:</span>
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20 uppercase">
                      {REASON_LABELS[request.reason] || request.reason}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  {request.details ? (
                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                        What the buyer said
                      </p>
                      <p className="text-sm text-zinc-200 leading-relaxed">
                        {request.details}
                      </p>
                    </div>
                  ) : null}

                  {request.evidenceUrls.length ? (
                    <div className="flex flex-wrap gap-2">
                      {request.evidenceUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/5 hover:border-[#155DFC]/40 rounded-xl text-xs text-zinc-300 transition-all"
                        >
                          <ImageIcon size={14} className="text-blue-500" />
                          Evidence {i + 1}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleApprove(request)}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Check size={18} />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(request)}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <X size={18} />
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
