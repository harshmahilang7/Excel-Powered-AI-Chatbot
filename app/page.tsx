"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import FileUpload from "@/components/FileUpload";
import ChatInterface from "@/components/ChatInterface";
import DbStats from "@/components/DbStats";
import type { ColumnStat } from "@/types";

interface DbInfo {
  fileName: string;
  totalRows: number;
  headers: string[];
  warning?: string;
  stats?: ColumnStat[];
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("chatSessionId");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("chatSessionId", id);
  }
  return id;
}

export default function HomePage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const handleUploadSuccess = useCallback((data: DbInfo) => {
    setDbInfo(data);
    setUploadError(null);
    setUploadWarning(data.warning ?? null);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const handleUploadError = useCallback((error: string) => {
    setUploadError(error);
  }, []);

  const handleReset = useCallback(async () => {
    if (!sessionId) return;
    await fetch(`/api/session?sessionId=${sessionId}`, { method: "DELETE" });
    setDbInfo(null);
    setUploadError(null);
    setUploadWarning(null);
    const newId = crypto.randomUUID();
    sessionStorage.setItem("chatSessionId", newId);
    setSessionId(newId);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/[0.07] bg-[#0f0f13]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-900/30"
              aria-hidden="true"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-white block leading-none">
                Campus Guide
              </span>
              <span className="text-xs text-white/35 leading-none block mt-0.5 hidden sm:block">
                Student Orientation Assistant
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/90 bg-white/[0.08] border border-white/[0.1] transition-all duration-150 hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-violet-500"
              aria-current="page"
            >
              Chat
            </Link>
            <Link
              href="/about"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/45 hover:text-white/80 hover:bg-white/[0.05] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              About
            </Link>

            {dbInfo && (
              <>
                <div className="w-px h-4 bg-white/[0.1] mx-1" aria-hidden="true" />
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/35 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Clear database and reset"
                >
                  Reset
                </button>
              </>
            )}

            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg hover:bg-white/[0.08] transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
              aria-label={sidebarOpen ? "Hide upload panel" : "Show upload panel"}
              aria-expanded={sidebarOpen}
            >
              <svg
                className="w-4 h-4 text-white/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {/* Main layout */}
      <main
        className="flex-1 max-w-7xl w-full mx-auto flex overflow-hidden"
        style={{ height: "calc(100vh - 3.5rem)" }}
      >
        {/* Sidebar */}
        <aside
          className={`
            ${sidebarOpen ? "w-full md:w-80 lg:w-96" : "w-0 overflow-hidden"}
            md:flex-shrink-0 transition-all duration-300
            border-r border-white/[0.07] bg-[#111118] flex flex-col
          `}
          aria-label="Database upload panel"
        >
          <div className="p-6 flex flex-col gap-5 h-full overflow-y-auto min-w-72">
            {/* Section header */}
            <div>
              <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Student Database
              </h2>
              <p className="text-white/35 text-xs mt-1.5 leading-relaxed">
                Upload the college Excel file. Students can then ask questions
                and get instant answers.
              </p>
            </div>

            {/* Upload widget */}
            {sessionId && (
              <FileUpload
                sessionId={sessionId}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                isUploaded={!!dbInfo}
              />
            )}

            {/* Error */}
            {uploadError && (
              <div
                role="alert"
                className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5"
              >
                <svg
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="space-y-0.5">
                  <p className="font-semibold text-red-200/90">Upload failed</p>
                  <p className="text-red-300/70 leading-relaxed">{uploadError}</p>
                </div>
              </div>
            )}

            {/* Warning (irrelevant data) */}
            {uploadWarning && (
              <div
                role="alert"
                className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/80 text-xs flex items-start gap-2.5"
              >
                <svg
                  className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                <p className="leading-relaxed">{uploadWarning}</p>
              </div>
            )}

            {/* Active DB card */}
            {dbInfo && (
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                      aria-hidden="true"
                    />
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                </div>
                <div>
                  <p
                    className="text-white/80 font-semibold text-sm truncate"
                    title={dbInfo.fileName}
                  >
                    {dbInfo.fileName}
                  </p>
                  <p className="text-white/35 text-xs mt-1">
                    {dbInfo.totalRows.toLocaleString()} students ·{" "}
                    {dbInfo.headers.length} columns
                  </p>
                </div>

                {/* Column tags */}
                <div className="flex flex-wrap gap-1.5">
                  {dbInfo.headers.slice(0, 5).map((h) => (
                    <span
                      key={h}
                      className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/15 text-violet-300/80 text-[11px] font-medium"
                    >
                      {h}
                    </span>
                  ))}
                  {dbInfo.headers.length > 5 && (
                    <span className="px-2 py-0.5 text-white/25 text-[11px]">
                      +{dbInfo.headers.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Analytics widget */}
            {dbInfo?.stats && dbInfo.stats.length > 0 && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4">
                <DbStats stats={dbInfo.stats} />
              </div>
            )}

            {/* How it works */}
            <div className="mt-auto pt-5 border-t border-white/[0.06]">
              <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-3">
                How it works
              </p>
              <ol className="space-y-3">
                {[
                  {
                    n: "1",
                    text: "Upload the student Excel file",
                    sub: "Any .xlsx, .xls or .csv",
                  },
                  {
                    n: "2",
                    text: "Student types their question",
                    sub: 'e.g. "Where is my class?"',
                  },
                  {
                    n: "3",
                    text: "AI finds and explains the answer",
                    sub: "From the database instantly",
                  },
                ].map(({ n, text, sub }) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400 text-[10px] flex items-center justify-center font-bold mt-0.5">
                      {n}
                    </span>
                    <div>
                      <p className="text-white/55 text-xs font-medium">{text}</p>
                      <p className="text-white/25 text-[11px] mt-0.5">{sub}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <Link
                href="/about"
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/35 text-xs hover:text-white/60 hover:bg-white/[0.07] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Learn how this was built
              </Link>
            </div>
          </div>
        </aside>

        {/* Chat panel */}
        <section
          className="flex-1 flex flex-col min-w-0 overflow-hidden"
          aria-label="Chat interface"
        >
          {/* Empty state when sidebar hidden and no db */}
          {!dbInfo && !sidebarOpen && (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-violet-400/70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-white/55 font-semibold text-sm">
                  Upload a database first
                </p>
                <p className="text-white/25 text-xs">
                  Tap the menu icon to open the upload panel
                </p>
              </div>
            </div>
          )}

          {(dbInfo || sidebarOpen) && (
            <ChatInterface
              sessionId={sessionId}
              isReady={!!dbInfo}
              dbInfo={dbInfo}
            />
          )}
        </section>
      </main>
    </div>
  );
}
