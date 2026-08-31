"use client";

import React, { useState } from "react";
import { X, FileText, Download, ZoomIn, ZoomOut, RotateCw, Check, AlertTriangle, ShieldCheck, User, Calendar, ExternalLink } from "lucide-react";
import { SellerVerificationRequest, VerificationDocument } from "@/app/store/slices/sellerVerificationSlice";

interface DocumentPreviewModalProps {
  request: SellerVerificationRequest | null;
  docItem: string | VerificationDocument | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function DocumentPreviewModal({
  request,
  docItem,
  onClose,
  onApprove,
  onReject,
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  if (!request || !docItem) return null;

  const docName = typeof docItem === "string" ? docItem : docItem.name;
  const docUrl = typeof docItem === "object" ? docItem.url : undefined;
  const isIdCard = docName.toLowerCase().includes("id") || docName.toLowerCase().includes("card") || docName.toLowerCase().includes("passport");
  const isLicense = docName.toLowerCase().includes("license") || docName.toLowerCase().includes("business");

  const handleDownload = () => {
    if (docUrl) {
      window.open(docUrl, "_blank");
      return;
    }
    // Simulate download of the verified document
    const element = document.createElement("a");
    const file = new Blob([
      `DOCUMENT VERIFICATION RECORD\n` +
      `-----------------------------\n` +
      `Document Type: ${docName}\n` +
      `Applicant Name: ${request.name}\n` +
      `Applicant Email: ${request.email}\n` +
      `Request ID: ${request.id}\n` +
      `Category: ${request.category}\n` +
      `Submission Date: ${request.submitted}\n` +
      `Verification Status: ${request.status}\n`
    ], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${request.name.replace(/\s+/g, "_")}_${docName.replace(/\s+/g, "_")}.txt`;
    element.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white leading-tight">{docName}</h2>
                <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-yellow-500/20">
                  {request.status}
                </span>
              </div>
              <p className="text-zinc-500 text-xs mt-0.5">
                Submitted by <span className="text-zinc-300 font-medium">{request.name}</span> ({request.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Download Document"
            >
              <Download size={14} />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="px-5 py-2.5 bg-black/40 border-b border-white/5 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <User size={13} className="text-zinc-500" />
              ID: <span className="font-mono text-zinc-300">{request.id}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={13} className="text-zinc-500" />
              Date: <span className="text-zinc-300">{request.submitted}</span>
            </span>
          </div>

          {/* Viewer Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 15))}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <span className="text-[11px] font-mono text-zinc-400 min-w-[40px] text-center">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(200, z + 15))}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw size={15} />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto p-6 bg-black/60 flex items-center justify-center min-h-[350px]">
          {docUrl ? (
            <div
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: "transform 0.2s ease-out",
              }}
              className="origin-center shadow-2xl rounded-2xl overflow-hidden max-w-full"
            >
              {docUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={docUrl}
                  alt={docName}
                  className="max-h-[500px] object-contain rounded-2xl border border-white/10"
                />
              ) : (
                <iframe
                  src={docUrl}
                  title={docName}
                  className="w-[600px] h-[450px] bg-white rounded-2xl border border-white/10"
                />
              )}
            </div>
          ) : (
            /* High-fidelity Document Graphic Mock */
            <div
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: "transform 0.2s ease-out",
              }}
              className="origin-center"
            >
              {isIdCard ? (
                /* Government / State ID Card Preview */
                <div className="w-[480px] h-[290px] bg-gradient-to-br from-zinc-900 via-[#181a20] to-zinc-950 border border-white/15 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between text-zinc-200">
                  {/* Watermark effect */}
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                    <ShieldCheck size={260} />
                  </div>
                  
                  {/* Top ID Header */}
                  <div className="flex justify-between items-start border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] tracking-[0.25em] uppercase text-blue-400 font-extrabold block">Official Identification</span>
                      <h3 className="text-base font-bold text-white">NATIONAL VERIFICATION ID</h3>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-md text-green-400 text-[10px] font-bold">
                      <ShieldCheck size={12} />
                      OFFICIAL
                    </div>
                  </div>

                  {/* ID Body */}
                  <div className="grid grid-cols-3 gap-4 my-auto">
                    {/* Photo slot */}
                    <div className="aspect-[3/4] bg-zinc-800 border border-white/10 rounded-xl flex flex-col items-center justify-center text-zinc-500 relative overflow-hidden">
                      <User size={48} className="text-zinc-600" />
                      <span className="text-[9px] font-bold text-zinc-400 mt-1 uppercase">Photo ID</span>
                      <div className="absolute bottom-1 bg-[#155DFC]/30 px-2 py-0.5 rounded text-[8px] text-blue-300 font-mono">
                        VERIFIED
                      </div>
                    </div>

                    {/* Details */}
                    <div className="col-span-2 space-y-2 text-xs">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Full Legal Name</span>
                        <span className="font-bold text-white text-sm">{request.name}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Email Address</span>
                        <span className="font-mono text-zinc-300 text-[11px]">{request.email}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Document ID</span>
                          <span className="font-mono text-zinc-300 text-[10px]">ID-{request.id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Category</span>
                          <span className="text-blue-400 font-semibold text-[11px]">{request.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ID Footer */}
                  <div className="border-t border-white/10 pt-2 flex justify-between items-center text-[10px] font-mono text-zinc-500">
                    <span>DOC NO: {request.id.slice(0, 16).toUpperCase()}</span>
                    <span>SUBMITTED: {request.submitted}</span>
                  </div>
                </div>
              ) : isLicense ? (
                /* Business / Commercial License Certificate */
                <div className="w-[520px] h-[340px] bg-gradient-to-br from-[#13151b] via-[#101217] to-zinc-950 border border-white/15 rounded-2xl p-7 shadow-2xl relative overflow-hidden flex flex-col justify-between text-zinc-200">
                  <div className="text-center space-y-1 border-b border-white/10 pb-3">
                    <span className="text-[10px] tracking-[0.3em] uppercase text-yellow-400 font-bold block">Commercial Registry</span>
                    <h3 className="text-base font-bold text-white tracking-wide">CERTIFICATE OF BUSINESS LICENSE</h3>
                    <p className="text-[10px] text-zinc-500">Authorized by Merchant Commerce Commission</p>
                  </div>

                  <div className="space-y-3 my-auto text-xs px-4">
                    <div className="text-center">
                      <span className="text-[10px] uppercase text-zinc-500 block">This certifies that</span>
                      <span className="text-lg font-bold text-white">{request.name}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase">License ID</span>
                        <span className="font-mono text-zinc-300 text-[11px]">LIC-{request.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase">Sector</span>
                        <span className="font-medium text-blue-400 text-[11px]">{request.category}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase">Valid From</span>
                        <span className="text-zinc-300 text-[11px]">{request.submitted}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-3 flex justify-between items-center text-[10px] text-zinc-500">
                    <span className="font-mono">STATUS: {request.status.toUpperCase()}</span>
                    <span className="text-green-400 font-bold flex items-center gap-1">
                      <ShieldCheck size={13} />
                      VALID COMMERCIAL SEAL
                    </span>
                  </div>
                </div>
              ) : (
                /* Standard Generic Verification Document */
                <div className="w-[450px] h-[300px] bg-zinc-900 border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <FileText size={24} className="text-blue-500" />
                    <div>
                      <h4 className="font-bold text-white text-sm">{docName}</h4>
                      <p className="text-xs text-zinc-500">{request.name} • {request.category}</p>
                    </div>
                  </div>

                  <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-xs space-y-2 text-zinc-400">
                    <p>Submitted Document Verification File: <strong className="text-zinc-200">{docName}</strong></p>
                    <p>Applicant: <strong className="text-zinc-200">{request.name}</strong></p>
                    <p>Registration ID: <strong className="font-mono text-zinc-200">{request.id}</strong></p>
                    <p>Submission Timestamp: <strong className="text-zinc-200">{request.submitted}</strong></p>
                  </div>

                  <div className="text-[11px] text-zinc-500 flex justify-between items-center">
                    <span>Format: Official Digital Submission</span>
                    <span className="text-blue-400 font-semibold">Ready for Review</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Quick Review Actions */}
        <div className="p-5 border-t border-white/5 bg-black/40 flex items-center justify-between shrink-0">
          <div className="text-xs text-zinc-500">
            Verify all applicant credentials before taking action.
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                onReject(request.id);
                onClose();
              }}
              className="px-5 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <AlertTriangle size={15} />
              Reject Request
            </button>
            <button
              type="button"
              onClick={() => {
                onApprove(request.id);
                onClose();
              }}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-600/20 cursor-pointer"
            >
              <Check size={15} />
              Approve Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
