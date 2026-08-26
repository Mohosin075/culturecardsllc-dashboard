"use client";

import React, { useState, useEffect } from "react";
import { 
  Eye, 
  MessageSquare, 
  Check, 
  X, 
  FileImage, 
  FileText,
  Clock,
  Loader2
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchDisputes, resolveDispute, rejectDispute, DisputeItem } from "@/app/store/slices/disputesSlice";
import { useAlert } from "@/app/context/AlertContext";
import ErrorState from "@/app/components/ErrorState";
import Pagination from "@/app/components/Pagination";

export default function DisputesPage() {
  const dispatch = useAppDispatch();
  const { items: disputes, loading } = useAppSelector((state) => state.disputes);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const { showAlert, showConfirm, showPrompt } = useAlert();

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const totalPages = Math.ceil(disputes.length / rowsPerPage);
  const paginatedDisputes = disputes.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    dispatch(fetchDisputes());
  }, [dispatch]);

  const handleResolve = async (disputeId: string) => {
    showConfirm(
      `Are you sure you want to mark dispute ${disputeId} as resolved?`,
      () => {
        dispatch(resolveDispute(disputeId));
        showAlert("Dispute resolved successfully.", "success");
      },
      "Resolve Dispute"
    );
  };

  const handleReject = async (disputeId: string) => {
    showPrompt(
      "Reject Dispute",
      "Enter reason for rejection",
      (reason) => {
        dispatch(rejectDispute({ id: disputeId, reason }));
        showAlert("Dispute rejected.", "info");
      },
      "Dispute rejected by moderator"
    );
  };

  const { error } = useAppSelector((state) => state.disputes);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#155DFC]" size={40} />
      </div>
    );
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchDisputes())} />;
  }

  return (
    <div className="space-y-8 pb-12">
      <h1 className="text-3xl font-semibold text-white">Dispute Management</h1>

      <div className="space-y-6">
        {disputes.length === 0 ? (
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500">
              <Clock size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-200">No Disputes Found</h3>
              <p className="text-sm text-zinc-500 max-w-sm">
                There are currently no active disputes or support tickets requiring attention.
              </p>
            </div>
          </div>
        ) : (
          <>
            {paginatedDisputes.map((dispute: DisputeItem) => (
            <div key={dispute.id} className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{dispute.id}</h2>
                  <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    dispute.status === 'Open' || dispute.status === 'Reviewing'
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      : 'bg-green-500/10 text-green-500 border-green-500/20'
                  }`}>
                    {dispute.status}
                  </span>
                  <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    dispute.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                  }`}>
                    {dispute.priority}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-zinc-500 text-xs">
                  <Clock size={12} />
                  <span>Opened on {dispute.date}</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Users Involved:</p>
                  <div className="flex gap-4">
                    {dispute.users?.map((user: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${user.color || 'bg-blue-500'} flex items-center justify-center text-[10px] font-bold text-white`}>
                          {user.initial || user.name?.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-zinc-300">{user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 text-xs">Order/Trade ID:</span>
                    <span className="text-zinc-200 font-mono">{dispute.targetId}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 text-xs">Issue Type:</span>
                    <span className="text-zinc-200 font-medium">{dispute.issueType}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Description:</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{dispute.description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedDispute(dispute)}
                    className="flex items-center gap-2 bg-[#155DFC] hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    <Eye size={18} />
                    View Evidence
                  </button>
                  <button
                    onClick={() => showAlert(`Opening moderator chat room with dispute participants: ${dispute.users.map(u => u.name).join(", ")}`, "info")}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/5 cursor-pointer"
                  >
                    <MessageSquare size={18} />
                    Chat with Users
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleResolve(dispute.id)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-600/10 cursor-pointer"
                  >
                    <Check size={18} />
                    Resolve
                  </button>
                  <button
                    onClick={() => handleReject(dispute.id)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-600/10 cursor-pointer"
                  >
                    <X size={18} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
            totalItems={disputes.length}
            itemNamePlural="disputes"
          />
          </>
        )}
      </div>

      {/* Evidence Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedDispute(null)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-xl bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedDispute.id} - Evidence</h2>
                  <p className="text-sm text-zinc-500 mt-1">{selectedDispute.issueType}</p>
                </div>
                <button 
                  onClick={() => setSelectedDispute(null)}
                  className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description:</p>
                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-sm text-zinc-300 leading-relaxed">
                    {selectedDispute.description}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Submitted Evidence:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-4 bg-black/40 border border-white/5 rounded-2xl text-zinc-300 hover:border-white/10 transition-colors cursor-pointer group">
                      <FileImage size={20} className="text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Photo evidence (3 images)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-black/40 border border-white/5 rounded-2xl text-zinc-300 hover:border-white/10 transition-colors cursor-pointer group">
                      <FileText size={20} className="text-zinc-500" />
                      <div>
                        <p className="text-sm font-medium">Communication logs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
