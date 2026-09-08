"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  ShieldCheck, 
  Save, 
  ExternalLink, 
  Eye, 
  Edit3, 
  Code2,
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  Clock,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  RemoveFormatting,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { api } from "@/app/lib/api";
import { useAlert } from "@/app/context/AlertContext";

type DocumentType = "privacy-policy" | "terms-and-condition";
type EditorTab = "visual" | "html" | "preview";

export default function LegalDocumentsPage() {
  const { showAlert } = useAlert();

  const [activeDoc, setActiveDoc] = useState<DocumentType>("privacy-policy");
  const [editorTab, setEditorTab] = useState<EditorTab>("visual");
  const [content, setContent] = useState<string>("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const visualEditorRef = useRef<HTMLDivElement>(null);

  // Server public base URL
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
  const serverBaseUrl = rawApiUrl.endsWith("/api/v1")
    ? rawApiUrl.slice(0, -"/api/v1".length)
    : rawApiUrl;

  const publicUrl =
    activeDoc === "privacy-policy"
      ? `${serverBaseUrl}/privacy-policy`
      : `${serverBaseUrl}/terms-and-conditions`;

  // Fetch document content from backend MongoDB
  const loadDocument = async (type: DocumentType) => {
    setLoading(true);
    try {
      const res = await api.legal.get(type);
      if (res && res.content !== undefined) {
        const loadedContent = res.content || "";
        setContent(loadedContent);
        if (visualEditorRef.current) {
          visualEditorRef.current.innerHTML = loadedContent;
        }
        if (res.updatedAt) {
          setLastSaved(new Date(res.updatedAt).toLocaleString());
        } else {
          setLastSaved(null);
        }
      } else {
        setContent("");
        if (visualEditorRef.current) {
          visualEditorRef.current.innerHTML = "";
        }
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
    loadDocument(activeDoc);
  }, [activeDoc]);

  // Sync visual editor innerHTML when switching back to visual mode
  useEffect(() => {
    if (editorTab === "visual" && visualEditorRef.current) {
      if (visualEditorRef.current.innerHTML !== content) {
        visualEditorRef.current.innerHTML = content;
      }
    }
  }, [editorTab, content]);

  // Handle changes in visual WYSIWYG editor
  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      const newHtml = visualEditorRef.current.innerHTML;
      setContent(newHtml);
      setHasChanges(true);
    }
  };

  // Handle changes in HTML code mode
  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  // Rich text formatting commands
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (editorTab !== "visual") {
      setEditorTab("visual");
    }
    setTimeout(() => {
      if (visualEditorRef.current) {
        visualEditorRef.current.focus();
        document.execCommand(command, false, value);
        handleVisualInput();
      }
    }, 50);
  };

  const handleInsertLink = () => {
    const url = prompt("Enter the destination URL:");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showAlert("Document content cannot be empty.", "error");
      return;
    }

    setSaving(true);
    try {
      await api.legal.update(activeDoc, content);
      setLastSaved(new Date().toLocaleString());
      setHasChanges(false);
      showAlert(
        `${activeDoc === "privacy-policy" ? "Privacy Policy" : "Terms & Conditions"} saved to database successfully!`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      showAlert(err?.message || "Failed to save document.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Quick word & line calculations
  const plainText = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText ? plainText.split(" ").length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
              MongoDB Stored
            </span>
            <span className="text-xs text-zinc-500">• Instant Live Updates</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Legal Document Editor</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Edits are stored directly in the database. The public web pages and mobile app will update instantly.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 text-sm font-medium border border-white/10 transition-colors"
          >
            <span>View Live URL</span>
            <ExternalLink size={15} className="text-blue-400" />
          </a>

          <button
            onClick={handleSave}
            disabled={saving || loading || !hasChanges}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${
              hasChanges && !saving && !loading
                ? "bg-[#155DFC] hover:bg-blue-600 text-white shadow-blue-500/25 scale-[1.02]"
                : "bg-white/10 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving to Database...</span>
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

      {/* Control Bar: Document Switcher & Modes */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Document Tabs */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 w-full md:w-auto">
          <button
            onClick={() => setActiveDoc("privacy-policy")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeDoc === "privacy-policy"
                ? "bg-[#155DFC] text-white shadow-md shadow-blue-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={16} />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveDoc("terms-and-condition")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeDoc === "terms-and-condition"
                ? "bg-[#155DFC] text-white shadow-md shadow-blue-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FileText size={16} />
            <span>Terms & Conditions</span>
          </button>
        </div>

        {/* View Mode Buttons & Status */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {lastSaved && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Clock size={13} />
              <span>Saved: {lastSaved}</span>
            </div>
          )}

          {hasChanges && (
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold animate-pulse">
              Unsaved Changes
            </span>
          )}

          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setEditorTab("visual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                editorTab === "visual"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Edit3 size={14} />
              <span>Visual Editor</span>
            </button>
            <button
              onClick={() => setEditorTab("html")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                editorTab === "html"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Code2 size={14} />
              <span>HTML Source</span>
            </button>
            <button
              onClick={() => setEditorTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                editorTab === "preview"
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Eye size={14} />
              <span>Live Preview</span>
            </button>
          </div>

          <button
            onClick={() => loadDocument(activeDoc)}
            title="Reload from MongoDB"
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-blue-400" : ""} />
          </button>
        </div>
      </div>

      {/* Editor Box */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-[650px]">
        {/* WYSIWYG Toolbar (Active in visual mode) */}
        {editorTab === "visual" && (
          <div className="bg-black/50 border-b border-white/5 p-2.5 flex flex-wrap items-center gap-1">
            {/* Text Style Group */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 mr-2">
              <button
                type="button"
                onClick={() => executeCommand("bold")}
                title="Bold (Ctrl+B)"
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <Bold size={15} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("italic")}
                title="Italic (Ctrl+I)"
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <Italic size={15} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("underline")}
                title="Underline (Ctrl+U)"
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <Underline size={15} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("strikeThrough")}
                title="Strikethrough"
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <Strikethrough size={15} />
              </button>
            </div>

            {/* Headings Group */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 mr-2">
              <button
                type="button"
                onClick={() => executeCommand("formatBlock", "<h1>")}
                title="Heading 1"
                className="px-2.5 py-1 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => executeCommand("formatBlock", "<h2>")}
                title="Heading 2 (Section Title)"
                className="px-2.5 py-1 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => executeCommand("formatBlock", "<h3>")}
                title="Heading 3 (Subsection)"
                className="px-2.5 py-1 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => executeCommand("formatBlock", "<p>")}
                title="Paragraph"
                className="px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                P
              </button>
            </div>

            {/* Lists & Blocks */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 mr-2">
              <button
                type="button"
                onClick={() => executeCommand("insertUnorderedList")}
                title="Bullet List"
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <List size={15} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("insertOrderedList")}
                title="Numbered List"
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <ListOrdered size={15} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("formatBlock", "<blockquote>")}
                title="Quote / Callout Block"
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <Quote size={15} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("insertHorizontalRule")}
                title="Divider Line"
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <Minus size={15} />
              </button>
            </div>

            {/* Links & Clear */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 mr-2">
              <button
                type="button"
                onClick={handleInsertLink}
                title="Insert Link"
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <Link2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("removeFormat")}
                title="Remove Formatting"
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <RemoveFormatting size={15} />
              </button>
            </div>

            {/* Undo / Redo */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 ml-auto">
              <button
                type="button"
                onClick={() => executeCommand("undo")}
                title="Undo"
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-32 gap-3 text-zinc-400">
              <Loader2 className="animate-spin text-blue-500" size={36} />
              <p className="text-sm font-medium">Loading document from database...</p>
            </div>
          ) : editorTab === "visual" ? (
            <div className="min-h-[550px]">
              <div
                ref={visualEditorRef}
                contentEditable
                onInput={handleVisualInput}
                className="w-full min-h-[550px] p-6 rounded-xl bg-black/60 border border-white/10 text-zinc-100 focus:outline-none focus:border-blue-500 leading-relaxed text-base prose prose-invert max-w-none transition-colors"
                style={{
                  outline: "none",
                }}
              />
            </div>
          ) : editorTab === "html" ? (
            <div className="space-y-2">
              <div className="text-xs text-zinc-500 px-1">
                Direct HTML Source Mode. You can paste custom HTML, classes, or edit tags directly.
              </div>
              <textarea
                value={content}
                onChange={handleHtmlChange}
                placeholder="Paste or write HTML markup here..."
                className="w-full min-h-[550px] p-5 rounded-xl bg-black/60 border border-white/10 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono text-sm leading-relaxed custom-scrollbar resize-y transition-colors"
              />
            </div>
          ) : (
            /* Live Preview Mode */
            <div className="bg-slate-50 text-slate-900 rounded-xl p-8 max-w-4xl mx-auto shadow-inner border border-slate-200">
              <div className="text-center pb-8 border-b border-slate-200 mb-8">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                  Live Public Preview
                </span>
                <h1 className="text-3xl font-extrabold text-slate-900 mt-3 mb-2">
                  {activeDoc === "privacy-policy" ? "Privacy Policy" : "Terms & Conditions"}
                </h1>
                <p className="text-xs text-slate-500">
                  AREIS LLC • Live Preview Simulation
                </p>
              </div>

              <div
                className="prose max-w-none text-slate-800 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          )}
        </div>

        {/* Footer Info & Metrics */}
        <div className="bg-black/40 border-t border-white/5 px-6 py-3 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>~{readingTime} min read</span>
            <span>•</span>
            <span>{content.length} characters</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-zinc-400">Database Synced</span>
          </div>
        </div>
      </div>

      {/* Help & Documentation Banner */}
      <div className="flex items-start gap-4 bg-gradient-to-r from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-2xl p-6 text-sm">
        <Sparkles size={24} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <h3 className="font-semibold text-white text-base">Industry Standard Legal Architecture</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Legal policies are maintained directly inside MongoDB for instant administrative updates without needing server deployments. When you click <strong className="text-zinc-200">Save Changes</strong>, the live web routes (<code className="text-blue-300 bg-blue-900/30 px-1.5 py-0.5 rounded text-[11px]">{publicUrl}</code>) and mobile app API (<code className="text-blue-300 bg-blue-900/30 px-1.5 py-0.5 rounded text-[11px]">/api/v1/public/{activeDoc}</code>) immediately render the updated policy with a dynamically generated Table of Contents.
          </p>
        </div>
      </div>
    </div>
  );
}
