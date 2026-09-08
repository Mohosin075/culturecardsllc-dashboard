"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  UserCheck, 
  FileText, 
  Printer, 
  Share2, 
  Clock, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { api } from "@/app/lib/api";

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<string>("section-1");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function fetchPolicy() {
      try {
        const res = await api.legal.get("privacy-policy");
        if (res && res.content) {
          setContent(res.content);
        }
      } catch (err) {
        console.error("Failed to load privacy policy from API:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPolicy();
  }, []);

  // Scroll spy to highlight active TOC item
  useEffect(() => {
    if (!content) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0.1 }
    );

    const sections = document.querySelectorAll("section[id^='section-']");
    sections.forEach((sec) => observer.observe(sec));

    return () => observer.disconnect();
  }, [content]);


  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

    const handleTocClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const tocItems = [
    { id: "section-1", num: "01", title: "Information We Collect" },
    { id: "section-2", num: "02", title: "How We Use Information" },
    { id: "section-3", num: "03", title: "Buyers & Sellers" },
    { id: "section-4", num: "04", title: "Information We Share" },
    { id: "section-5", num: "05", title: "Data Security" },
    { id: "section-6", num: "06", title: "Data Retention" },
    { id: "section-7", num: "07", title: "Cookies & Technologies" },
    { id: "section-8", num: "08", title: "Children's Privacy" },
    { id: "section-9", num: "09", title: "Your Privacy Rights" },
    { id: "section-10", num: "10", title: "Privacy Requests" },
    { id: "section-11", num: "11", title: "California Privacy Rights" },
    { id: "section-12", num: "12", title: "Florida Privacy Rights" },
    { id: "section-13", num: "13", title: "Business Transfers" },
    { id: "section-14", num: "14", title: "Legal Compliance" },
    { id: "section-15", num: "15", title: "Changes to This Policy" },
    { id: "section-16", num: "16", title: "Contact AREIS LLC" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0d14] text-zinc-100 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#0a0d14]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/25">
              A
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">AREIS</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 text-zinc-400">
                Legal Center
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/privacy-policy"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600/15 text-blue-400 border border-blue-500/20"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-and-conditions"
              className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Terms & Conditions
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="Copy page link"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-zinc-300 hover:bg-white/5 transition-colors"
            >
              <Share2 size={13} />
              <span>{copied ? "Copied!" : "Share"}</span>
            </button>
            <button
              onClick={handlePrint}
              title="Print document"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-8 sm:pt-16 pb-8 sm:pb-12 border-b border-white/10 bg-gradient-to-b from-[#111625] to-[#0a0d14]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(21,93,252,0.15),rgba(255,255,255,0))]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Official Policy Document</span>
          </div>
          <h1 className="text-2xl sm:text-5xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto leading-relaxed">
            At AREIS LLC, we are dedicated to protecting your personal information and being transparent about our privacy practices.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-400" />
              <span>Effective: September 6, 2026</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-blue-400" />
              <span>AREIS LLC • Tampa, Florida, USA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-blue-400" />
              <span>~6 min read</span>
            </div>
          </div>
        </div>
      </section>

      {/* Executive Summary Cards: User-Friendly Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/30 transition-all space-y-1.5 sm:space-y-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Lock size={18} />
            </div>
            <h3 className="font-semibold text-white text-xs sm:text-sm">Security by Default</h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed line-clamp-3 sm:line-clamp-none">
              We encrypt sensitive data in transit and at rest. Payment cards are never stored on our servers.
            </p>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/30 transition-all space-y-1.5 sm:space-y-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={18} />
            </div>
            <h3 className="font-semibold text-white text-xs sm:text-sm">No Sale of Secrets</h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed line-clamp-3 sm:line-clamp-none">
              We never sell your passwords, credentials, or personal secrets to any third-party brokers.
            </p>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/30 transition-all space-y-1.5 sm:space-y-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <UserCheck size={18} />
            </div>
            <h3 className="font-semibold text-white text-xs sm:text-sm">You Are in Control</h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed line-clamp-3 sm:line-clamp-none">
              Florida & California rights: You can request access, correction, deletion, or a portable copy of your data anytime.
            </p>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/30 transition-all space-y-1.5 sm:space-y-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Eye size={18} />
            </div>
            <h3 className="font-semibold text-white text-xs sm:text-sm">Transparent Sharing</h3>
            <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed line-clamp-3 sm:line-clamp-none">
              Information is only shared with verified providers needed to fulfill your purchases, shipping, and security.
            </p>
          </div>
        </div>
      </section>

      {/* Main Layout: Sticky TOC + Readable Document */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-10 items-start">
        {/* Sticky Table of Contents */}
        <aside className="hidden lg:block sticky top-24 bg-[#111625]/90 border border-white/10 rounded-2xl p-6 backdrop-blur-md max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
          <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
            Contents Navigation
          </div>
          <ul className="space-y-1 text-xs">
            {tocItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleTocClick(item.id, e)}
                  className={`flex items-center gap-2.5 py-1.5 px-3 rounded-lg transition-all ${
                    activeSection === item.id
                      ? "bg-blue-600 text-white font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-60">{item.num}</span>
                  <span className="truncate">{item.title}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-xs text-zinc-400 mb-2">Need help?</div>
            <a
              href="mailto:ceoareisco@gmail.com"
              className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>ceoareisco@gmail.com</span>
              <ChevronRight size={12} />
            </a>
          </div>
        </aside>

        
        {/* Mobile Quick Jump Drawer */}
        <div className="lg:hidden bg-[#111625]/90 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-bold uppercase tracking-wider text-blue-400 select-none">
              <span className="flex items-center gap-2">
                <FileText size={14} />
                <span>Jump to Section ({tocItems.length} Sections)</span>
              </span>
              <span className="group-open:rotate-180 transition-transform text-zinc-400">▼</span>
            </summary>
            <ul className="mt-3 pt-3 border-t border-white/10 space-y-1 max-h-60 overflow-y-auto custom-scrollbar text-xs">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      handleTocClick(item.id, e);
                      (e.currentTarget.closest("details") as HTMLDetailsElement)?.removeAttribute("open");
                    }}
                    className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg transition-all ${
                      activeSection === item.id
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-60">{item.num}</span>
                    <span className="truncate">{item.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </div>

        {/* Document Content */}
        <main className="bg-[#111625]/60 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-12 shadow-2xl backdrop-blur-sm">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 className="animate-spin text-blue-500" size={36} />
              <p className="text-sm font-medium">Loading Privacy Policy...</p>
            </div>
          ) : content ? (
            <div
              className="legal-doc-rendered w-full"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="py-16 text-center text-zinc-400">
              The Privacy Policy document is currently being updated.
            </div>
          )}

          {/* Next Document Banner */}
          <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-900/20 to-transparent p-6 rounded-2xl border border-blue-500/20">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Next Document</div>
              <h4 className="text-lg font-bold text-white mt-0.5">Terms & Conditions</h4>
              <p className="text-xs text-zinc-400">Review the rules, auction terms, and seller commitments.</p>
            </div>
            <Link
              href="/terms-and-conditions"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all whitespace-nowrap w-full sm:w-auto"
            >
              <span>Read Terms</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#07090f] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            &copy; 2026 AREIS LLC. All rights reserved. 400 N TAMPA ST STE 1550 #650915, TAMPA, FL 33602, USA.
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/privacy-policy" className="hover:text-white underline">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:text-white underline">Terms & Conditions</Link>
            <a href="mailto:ceoareisco@gmail.com" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
