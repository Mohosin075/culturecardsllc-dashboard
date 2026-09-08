"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  ShieldCheck, 
  Save, 
  ExternalLink, 
  Eye, 
  Edit3, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import { api } from "@/app/lib/api";
import { useAlert } from "@/app/context/AlertContext";

type DocumentType = "privacy-policy" | "terms-and-condition";

export default function LegalDocumentsPage() {
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<DocumentType>("privacy-policy");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [content, setContent] = useState<string>("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Server public base URL
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
  const serverBaseUrl = rawApiUrl.endsWith("/api/v1")
    ? rawApiUrl.slice(0, -"/api/v1".length)
    : rawApiUrl;

  const publicUrl =
    activeTab === "privacy-policy"
      ? `${serverBaseUrl}/privacy-policy`
      : `${serverBaseUrl}/terms-and-conditions`;

  // Fetch document content from backend
  const loadDocument = async (type: DocumentType) => {
    setLoading(true);
    try {
      const res = await api.legal.get(type);
      if (res && res.content !== undefined) {
        setContent(res.content || "");
        if (res.updatedAt) {
          setLastSaved(new Date(res.updatedAt).toLocaleString());
        } else {
          setLastSaved(null);
        }
      } else {
        setContent("");
      }
      setHasChanges(false);
    } catch (err: any) {
      console.error(err);
      showAlert(err?.message || "Failed to load document.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocument(activeTab);
  }, [activeTab]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showAlert("Document content cannot be empty.", "error");
      return;
    }

    setSaving(true);
    try {
      await api.legal.update(activeTab, content);
      setLastSaved(new Date().toLocaleString());
      setHasChanges(false);
      showAlert(
        `${activeTab === "privacy-policy" ? "Privacy Policy" : "Terms & Conditions"} updated successfully!`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      showAlert(err?.message || "Failed to save document.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Render plaintext/HTML preview
  const renderFormattedPreview = (raw: string) => {
    if (!raw.trim()) {
      return (
        <div className="text-zinc-500 italic py-12 text-center">
          No content written yet.
        </div>
      );
    }

    // Check if raw contains HTML tags
    const hasHtml = /<[a-z][\s\S]*>/i.test(raw);
    if (hasHtml) {
      return (
        <div
          className="prose prose-invert max-w-none text-zinc-300 leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: raw }}
        />
      );
    }

    // Format plain text by paragraphs
    const paragraphs = raw.split(/\n{2,}/);
    return (
      <div className="space-y-4 text-zinc-300 leading-relaxed">
        {paragraphs.map((para, idx) => {
          const trimmed = para.trim();
          if (trimmed.startsWith("# ")) {
            return (
              <h1 key={idx} className="text-2xl font-bold text-white pt-4 pb-2 border-b border-white/10">
                {trimmed.substring(2)}
              </h1>
            );
          }
          if (trimmed.startsWith("## ")) {
            return (
              <h2 key={idx} className="text-xl font-semibold text-white pt-3 pb-1 border-b border-white/5">
                {trimmed.substring(3)}
              </h2>
            );
          }
          if (trimmed.startsWith("### ")) {
            return (
              <h3 key={idx} className="text-lg font-medium text-white pt-2">
                {trimmed.substring(4)}
              </h3>
            );
          }
          return (
            <p key={idx} className="whitespace-pre-line text-sm text-zinc-300">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content ? content.split("\n").length : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Legal Documents</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your mobile app and web legal policies. Updates reflect immediately on live public routes.
          </p>
        </div>

        {/* View Public Route Link */}
        <div className="flex items-center gap-3">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 text-sm font-medium border border-white/10 transition-colors"
          >
            <span>View Public Page</span>
            <ExternalLink size={15} className="text-blue-400" />
          </a>

          <button
            onClick={handleSave}
            disabled={saving || loading || !hasChanges}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${
              hasChanges && !saving && !loading
                ? "bg-[#155DFC] hover:bg-blue-600 text-white shadow-blue-500/20"
                : "bg-white/10 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs & Controls Bar */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Document Tabs */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("privacy-policy")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "privacy-policy"
                ? "bg-[#155DFC] text-white shadow-md shadow-blue-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={16} />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab("terms-and-condition")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "terms-and-condition"
                ? "bg-[#155DFC] text-white shadow-md shadow-blue-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FileText size={16} />
            <span>Terms & Conditions</span>
          </button>
        </div>

        {/* Status & View Mode */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {lastSaved && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Clock size={13} />
              <span>Saved: {lastSaved}</span>
            </div>
          )}

          {hasChanges && (
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-medium">
              Unsaved Changes
            </span>
          )}

          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode("edit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "edit"
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "preview"
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Eye size={14} />
              <span>Preview</span>
            </button>
          </div>

          <button
            onClick={() => loadDocument(activeTab)}
            title="Reload from server"
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-blue-400" : ""} />
          </button>
        </div>
      </div>

      {/* Editor & Preview Area */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 min-h-[600px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p className="text-sm">Loading document...</p>
          </div>
        ) : viewMode === "edit" ? (
          <div className="flex-1 flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
              <span>Plaintext, Markdown, or HTML tags are supported</span>
              <span>{wordCount} words • {lineCount} lines • {content.length} characters</span>
            </div>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Paste or write your document content here..."
              className="w-full flex-1 min-h-[550px] p-5 rounded-xl bg-black/60 border border-white/10 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono text-sm leading-relaxed custom-scrollbar resize-y transition-colors"
            />
          </div>
        ) : (
          <div className="flex-1 p-6 rounded-xl bg-black/40 border border-white/5 min-h-[550px] overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto py-4">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {activeTab === "privacy-policy" ? "Privacy Policy" : "Terms & Conditions"}
                </h1>
                <p className="text-xs text-zinc-500">
                  AREIS LLC • Live Preview
                </p>
              </div>
              {renderFormattedPreview(content)}
            </div>
          </div>
        )}
      </div>

      {/* Info Notice Box */}
      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 text-sm text-blue-300">
        <CheckCircle2 size={20} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-white">Live Public Endpoints & Mobile Compatibility</p>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Whenever you click <strong className="text-zinc-200">Save Changes</strong>, your modifications are stored in MongoDB. The public web URLs (
            <code className="text-blue-300 bg-blue-900/30 px-1.5 py-0.5 rounded text-[11px]">{publicUrl}</code>)
            and the mobile API endpoints (<code className="text-blue-300 bg-blue-900/30 px-1.5 py-0.5 rounded text-[11px]">/api/v1/public/{activeTab}</code>) will immediately serve the updated document without needing a server restart.
          </p>
        </div>
      </div>
    </div>
  );
}
