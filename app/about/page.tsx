import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Excel AI Chatbot",
  description:
    "How this chatbot works: architecture, tech stack, and the reasoning behind every design decision.",
};

const TECH_STACK = [
  {
    name: "Next.js 14",
    role: "The App Framework",
    color: "from-slate-600 to-slate-700",
    dot: "bg-slate-400",
    what: "Think of this as the complete toolkit for building the web app. It handles both the user interface you see and the backend server logic — all in one project, without needing separate systems.",
    why: "Single codebase, faster development, and built-in routing between pages.",
  },
  {
    name: "Groq + LLaMA 3.3 70B",
    role: "The AI Brain",
    color: "from-orange-600 to-red-700",
    dot: "bg-orange-400",
    what: "Groq is a superfast AI cloud service. LLaMA 3.3 70B is the actual AI model (made by Meta) running on it — a very capable model that reads the matched student records and crafts a human-friendly answer.",
    why: "Groq's inference is 10× faster than standard AI APIs. The 70B model gives high accuracy for understanding natural language questions.",
  },
  {
    name: "Fuse.js",
    role: "The Smart Search",
    color: "from-violet-600 to-purple-700",
    dot: "bg-violet-400",
    what: 'A fuzzy search library — like having Google search built into your data. If a student types "Arjun" or even "Arjnn" (with a typo), it still finds the right record. Works on names, roll numbers, classes, sections.',
    why: 'For structured college data (names, numbers, codes), fuzzy text search is actually more accurate than AI embeddings. No extra API needed, runs instantly.',
  },
  {
    name: "xlsx (SheetJS)",
    role: "The Excel Reader",
    color: "from-emerald-600 to-green-700",
    dot: "bg-emerald-400",
    what: "Reads Excel files (.xlsx, .xls) and CSV files and converts them into data the app can work with. It handles different formats, merged cells, and column variations automatically.",
    why: "Battle-tested, widely used, handles edge cases like empty rows and unusual file structures.",
  },
  {
    name: "React + Tailwind CSS",
    role: "The Interface",
    color: "from-cyan-600 to-blue-700",
    dot: "bg-cyan-400",
    what: "React builds the interactive UI (chat bubbles, upload zone, buttons). Tailwind CSS provides the visual styling — the dark theme, colors, spacing — using simple utility classes instead of writing custom CSS.",
    why: "React makes the chat interface reactive and smooth. Tailwind speeds up styling with no design system needed.",
  },
  {
    name: "In-Memory Session Store",
    role: "The Data Layer",
    color: "from-pink-600 to-rose-700",
    dot: "bg-pink-400",
    what: "After an Excel file is uploaded, the parsed student data lives in the server's memory tied to your session. No database required — data is available instantly and is automatically cleared after 2 hours.",
    why: "Zero infrastructure cost, zero latency. Perfect for a single-session use case like an orientation chatbot.",
  },
];

const FLOW_STEPS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    step: "01",
    title: "Excel Upload",
    desc: "The college admin uploads the student Excel file. The app reads every row and column, filters out blanks, and validates the structure.",
    tag: "xlsx library",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
    step: "02",
    title: "Index Building",
    desc: "A Fuse.js search index is built from all the rows and stored in server memory, keyed by a unique session ID for this browser tab.",
    tag: "Fuse.js + Session Store",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    step: "03",
    title: "Student Query",
    desc: 'A student types a natural language question like "My name is Priya, which class am I in?" The query is sent to the Next.js API.',
    tag: "Chat UI",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    step: "04",
    title: "Fuzzy Search",
    desc: "Two-pass search: first the full query, then token-by-token if needed. Stop-word filtering removes noise words like \"my\", \"where\", \"is\" so only meaningful terms are matched.",
    tag: "Fuse.js",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    step: "05",
    title: "LLM Answer",
    desc: "The top matching records are passed as context to Groq's LLaMA 70B model. The model reads the records and writes a friendly, clear answer in natural language.",
    tag: "Groq API",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0f0f13] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.07] bg-[#0f0f13]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/30" aria-hidden="true">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Campus Guide</span>
          </div>

          <nav className="flex items-center gap-1" aria-label="Main navigation">
            <Link href="/" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/45 hover:text-white/80 hover:bg-white/[0.05] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-500">
              Chat
            </Link>
            <Link href="/about" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/90 bg-white/[0.08] border border-white/[0.1] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-500" aria-current="page">
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-20">

        {/* Hero */}
        <section className="text-center space-y-5 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" aria-hidden="true" />
            Open Source · Reference Implementation
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            How{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Campus Guide
            </span>{" "}
            works
          </h1>

          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
            A smart orientation chatbot that reads your college's Excel database
            and answers new students' questions in plain English — no AI prompt
            engineering, no vector databases, no complexity.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Try the chatbot
          </Link>
        </section>

        {/* Problem + Solution */}
        <section>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-red-500/[0.06] border border-red-500/15 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-white font-semibold text-lg">The Problem</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                On Day 1, hundreds of new students flood the college, unsure where
                to go. They don't know their class, section, or room number.
                Administration desks get overwhelmed. Students wander. It's chaotic.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/15 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-white font-semibold text-lg">The Solution</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Upload the student database Excel (which colleges already maintain)
                to this app. Students open the website, type their name or roll
                number in plain English, and instantly get their class details —
                no staff intervention needed.
              </p>
            </div>
          </div>
        </section>

        {/* Architecture pipeline */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">
              How a question becomes an answer
            </h2>
            <p className="text-white/40 text-sm">
              Five steps, happening in under 2 seconds
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div
              className="absolute left-[2.25rem] top-8 bottom-8 w-px bg-gradient-to-b from-emerald-500/30 via-violet-500/30 to-orange-500/30 hidden md:block"
              aria-hidden="true"
            />

            <div className="space-y-4">
              {FLOW_STEPS.map(({ icon, step, title, desc, tag, color, bg }) => (
                <div
                  key={step}
                  className="flex gap-5 items-start p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] transition-colors duration-200"
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${bg} ${color}`}
                    aria-hidden="true"
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/25 text-xs font-mono font-bold">
                        {step}
                      </span>
                      <h3 className="text-white/90 font-semibold text-sm">{title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${bg} ${color}`}>
                        {tag}
                      </span>
                    </div>
                    <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech stack */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Tech Stack</h2>
            <p className="text-white/40 text-sm">
              Every tool chosen for a specific reason — explained in plain English
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {TECH_STACK.map(({ name, role, dot, what, why }) => (
              <div
                key={name}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5 space-y-3 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0 mt-1.5`} aria-hidden="true" />
                  <div>
                    <p className="text-white font-semibold text-sm">{name}</p>
                    <p className="text-white/40 text-xs mt-0.5">{role}</p>
                  </div>
                </div>

                <div className="space-y-2 pl-5">
                  <div>
                    <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider mb-1">
                      What it does
                    </p>
                    <p className="text-white/55 text-xs leading-relaxed">{what}</p>
                  </div>
                  <div>
                    <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wider mb-1">
                      Why we use it
                    </p>
                    <p className="text-white/55 text-xs leading-relaxed">{why}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why not pure RAG */}
        <section className="rounded-2xl bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.05] border border-violet-500/15 p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-xl">
              Why not pure RAG / vector embeddings?
            </h2>
          </div>

          <p className="text-white/50 text-sm leading-relaxed">
            <strong className="text-white/75">RAG (Retrieval-Augmented Generation)</strong> is the popular approach where you convert data into mathematical vectors and find matches using AI similarity. It works great for unstructured text like documents and PDFs.
          </p>
          <p className="text-white/50 text-sm leading-relaxed">
            But for <strong className="text-white/75">structured college data</strong> — exact names, roll numbers, section codes like "CS-A" — <strong className="text-white/75">fuzzy text search is actually more accurate</strong>. Here's why:
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                icon: "✓",
                good: true,
                title: "Fuse.js (our approach)",
                points: [
                  'Handles typos: "Arjnn" → "Arjun"',
                  "Exact roll number matching",
                  "No API key or extra cost",
                  "Results in under 1ms",
                  "Works offline / in-memory",
                ],
              },
              {
                icon: "✗",
                good: false,
                title: "Vector Embeddings (RAG)",
                points: [
                  "Needs embedding API calls",
                  "Higher latency and cost",
                  "Over-engineered for exact lookups",
                  "Requires vector database",
                  "Can confuse similar names",
                ],
              },
            ].map(({ icon, good, title, points }) => (
              <div
                key={title}
                className={`rounded-xl p-4 space-y-2 ${good ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/[0.06] border border-red-500/15"}`}
              >
                <p className={`text-sm font-semibold ${good ? "text-emerald-300" : "text-red-300/80"}`}>
                  {icon} {title}
                </p>
                <ul className="space-y-1">
                  {points.map((p) => (
                    <li key={p} className={`text-xs ${good ? "text-emerald-300/60" : "text-red-300/50"}`}>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-white/40 text-xs">
            The AI (Groq LLaMA) is still used — but only for the <em>final step</em>: turning the matched records into a friendly, natural-language answer. This hybrid approach gets the best of both worlds.
          </p>
        </section>

        {/* Edge case handling */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">
              What happens when things go wrong?
            </h2>
            <p className="text-white/40 text-sm">
              Every realistic scenario is handled gracefully — no silent failures, no confusing errors
            </p>
          </div>

          {/* File upload edge cases */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Excel / File Upload Scenarios
            </h3>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  scenario: "Completely blank file",
                  what: "File is rejected immediately",
                  how: "The sheet range is checked before parsing. A blank file has no usable range.",
                  outcome: "error",
                },
                {
                  scenario: "Headers only, no data rows",
                  what: "File is rejected with a specific message",
                  how: "The parser detects a sheet with columns but zero data rows and explains exactly what's missing.",
                  outcome: "error",
                },
                {
                  scenario: "Only one column",
                  what: "File is rejected",
                  how: "A valid student database needs at least 2 columns. Single-column files are caught before parsing begins.",
                  outcome: "error",
                },
                {
                  scenario: "All rows are empty (blank cells)",
                  what: "File is rejected after filtering",
                  how: "Every row where all cells are null/blank is filtered out. If nothing survives the filter, an error is shown.",
                  outcome: "error",
                },
                {
                  scenario: "Irrelevant data (e.g. grocery list)",
                  what: "File loads with a yellow warning",
                  how: "Column names are checked for student keywords (name, roll, class, section, room, etc.). If none match, a warning banner appears — the chatbot still tries to help.",
                  outcome: "warn",
                },
                {
                  scenario: "Mixed / partial data (some cells missing)",
                  what: "File loads normally",
                  how: "Empty rows are stripped. Rows with partial data (e.g. missing section) are kept — the LLM simply omits unavailable fields in its answer.",
                  outcome: "ok",
                },
                {
                  scenario: "Columns entirely empty",
                  what: "Those columns are silently removed",
                  how: "After parsing, any column where every single row has a null value is dropped from the index so it doesn't pollute search.",
                  outcome: "ok",
                },
                {
                  scenario: "Corrupted or password-protected file",
                  what: "File is rejected with a clear message",
                  how: "The xlsx parser throws during read. This is caught and returned as a human-readable error instead of a server crash.",
                  outcome: "error",
                },
                {
                  scenario: "File larger than 10 MB",
                  what: "Rejected before parsing even starts",
                  how: "File size is checked at the API boundary. A message shows the actual file size so the user knows why.",
                  outcome: "error",
                },
                {
                  scenario: "Wrong file type (PDF, Word, image)",
                  what: "Rejected by extension check",
                  how: "Only .xlsx, .xls, and .csv pass. The unsupported extension is shown in the error so users know what to upload instead.",
                  outcome: "error",
                },
              ].map(({ scenario, what, how, outcome }) => (
                <div
                  key={scenario}
                  className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 space-y-2 hover:bg-white/[0.05] transition-colors duration-200"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold
                        ${outcome === "error" ? "bg-red-500/20 text-red-400"
                          : outcome === "warn" ? "bg-amber-500/20 text-amber-400"
                          : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      aria-label={outcome === "error" ? "Rejected" : outcome === "warn" ? "Warning" : "Accepted"}
                    >
                      {outcome === "error" ? "✕" : outcome === "warn" ? "!" : "✓"}
                    </span>
                    <p className="text-white/80 text-sm font-semibold leading-tight">{scenario}</p>
                  </div>
                  <p className={`text-xs font-medium pl-6
                    ${outcome === "error" ? "text-red-400/80"
                      : outcome === "warn" ? "text-amber-400/80"
                      : "text-emerald-400/80"
                    }`}>
                    {what}
                  </p>
                  <p className="text-white/35 text-xs leading-relaxed pl-6">{how}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Query / chat edge cases */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              Chat Query Scenarios
            </h3>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  scenario: "Empty message",
                  what: "Blocked at the API",
                  how: "Zero-length queries are rejected before reaching the search or LLM. The user sees an inline error.",
                  outcome: "error",
                },
                {
                  scenario: "Single character (e.g. \"a\")",
                  what: "Rejected with a helpful hint",
                  how: "Queries under 2 characters can't produce meaningful results. The error asks for a name or roll number instead.",
                  outcome: "error",
                },
                {
                  scenario: "Message over 500 characters",
                  what: "Blocked with a character count",
                  how: "A real-time counter appears at 400+ chars. At 500 the send button stays disabled and the API rejects the request.",
                  outcome: "error",
                },
                {
                  scenario: "Aggregate query (\"how many\", \"list all\")",
                  what: "All records are passed to the LLM",
                  how: "A regex detects count/list intent and bypasses the search step entirely — the full dataset is sent so the LLM can give an accurate count or complete list.",
                  outcome: "ok",
                },
                {
                  scenario: "Query with typos (\"Arjnn Sharrma\")",
                  what: "Still finds the right record",
                  how: "Fuse.js fuzzy matching tolerates spelling errors up to a configurable threshold. Minor typos won't break the lookup.",
                  outcome: "ok",
                },
                {
                  scenario: "Name not in database",
                  what: "LLM says so politely",
                  how: "If search returns zero matches, the LLM receives an empty context and tells the student to contact administration — never makes up data.",
                  outcome: "warn",
                },
                {
                  scenario: "Unrelated question (\"What is 2+2?\")",
                  what: "LLM redirects politely",
                  how: "The system prompt instructs the LLM to only answer student/class queries. Off-topic questions get a polite redirect.",
                  outcome: "warn",
                },
                {
                  scenario: "Session expired (page left open too long)",
                  what: "Clear message to re-upload",
                  how: "Sessions expire after 2 hours of inactivity. The API returns a 404 with a message explaining exactly what to do.",
                  outcome: "error",
                },
                {
                  scenario: "AI service rate-limited",
                  what: "Specific retry message shown",
                  how: "Groq rate-limit errors are caught separately from other failures. The user is told to wait a few seconds, not shown a generic crash.",
                  outcome: "warn",
                },
              ].map(({ scenario, what, how, outcome }) => (
                <div
                  key={scenario}
                  className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 space-y-2 hover:bg-white/[0.05] transition-colors duration-200"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold
                        ${outcome === "error" ? "bg-red-500/20 text-red-400"
                          : outcome === "warn" ? "bg-amber-500/20 text-amber-400"
                          : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      aria-label={outcome === "error" ? "Rejected" : outcome === "warn" ? "Handled gracefully" : "Works correctly"}
                    >
                      {outcome === "error" ? "✕" : outcome === "warn" ? "!" : "✓"}
                    </span>
                    <p className="text-white/80 text-sm font-semibold leading-tight">{scenario}</p>
                  </div>
                  <p className={`text-xs font-medium pl-6
                    ${outcome === "error" ? "text-red-400/80"
                      : outcome === "warn" ? "text-amber-400/80"
                      : "text-emerald-400/80"
                    }`}>
                    {what}
                  </p>
                  <p className="text-white/35 text-xs leading-relaxed pl-6">{how}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 text-xs text-white/35 justify-center flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold flex items-center justify-center">✕</span>
              Blocked / Rejected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold flex items-center justify-center">!</span>
              Handled gracefully
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold flex items-center justify-center">✓</span>
              Works correctly
            </span>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 pb-8">
          <p className="text-white/40 text-sm">Ready to try it?</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-150 active:scale-95 shadow-lg shadow-violet-900/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Open the chatbot
          </Link>
        </section>

      </main>
    </div>
  );
}
