"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessageBubble from "./ChatMessage";
import type { ChatMessage, StreamEvent } from "@/types";

interface ChatInterfaceProps {
  sessionId: string;
  isReady: boolean;
  dbInfo: { fileName: string; totalRows: number; headers: string[] } | null;
}

const WELCOME_CONTENT =
  "Hello! I'm your college orientation assistant 👋\n\nAsk me anything about your **class**, **section**, **roll number**, or **room** — I'll look it up from the database instantly.";

const STATIC_SUGGESTIONS = [
  "Where is my class?",
  "What section am I in?",
  "Find roll number 101",
  "How many students are there?",
];

const STORAGE_KEY = "hcthon_chat_history";

type Phase = "idle" | "searching" | "generating";

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    // Keep at most 50 messages in storage (exclude welcome)
    const toSave = messages.filter((m) => m.id !== "welcome").slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // storage quota exceeded — ignore
  }
}

export default function ChatInterface({
  sessionId,
  isReady,
  dbInfo,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isLoading = phase !== "idle";

  // Initialize: welcome message + restore history client-side
  useEffect(() => {
    const history = loadHistory();
    const welcome: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: WELCOME_CONTENT,
      timestamp: 0,
    };
    setMessages([welcome, ...history]);
  }, []);

  // Persist whenever messages change (skip welcome)
  useEffect(() => {
    if (messages.length > 1) {
      saveHistory(messages);
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  const sendMessage = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || isLoading || !isReady) return;

      setError(null);
      setSuggestions([]);
      setInput("");

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setPhase("searching");

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed, sessionId }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          // Try to parse error from non-streaming response
          try {
            const data = await res.json();
            setError(data.error ?? "Something went wrong. Please try again.");
          } catch {
            setError("Something went wrong. Please try again.");
          }
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let event: StreamEvent;
            try {
              event = JSON.parse(line) as StreamEvent;
            } catch {
              continue;
            }

            if (event.type === "meta") {
              setPhase("generating");
              if (event.suggestions && event.suggestions.length > 0) {
                setSuggestions(event.suggestions);
              }
            } else if (event.type === "chunk") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + event.text }
                    : m
                )
              );
            } else if (event.type === "done") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, isStreaming: false } : m
                )
              );
              setPhase("idle");
            } else if (event.type === "error") {
              setError(event.message);
              setMessages((prev) => prev.filter((m) => m.id !== assistantId));
              setPhase("idle");
            }
          }
        }

        // Ensure streaming flag is cleared even if "done" event was missed
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
        setPhase("idle");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("Network error. Please check your connection and try again.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setPhase("idle");
      } finally {
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    },
    [isLoading, isReady, sessionId]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    const welcome: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: WELCOME_CONTENT,
      timestamp: 0,
    };
    setMessages([welcome]);
    setSuggestions([]);
    setError(null);
  };

  const showSuggestions = messages.length <= 1;
  const charCount = input.length;
  const nearLimit = charCount > 400;
  const hasHistory = messages.filter((m) => m.id !== "welcome").length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* DB info bar */}
      {dbInfo && (
        <div className="px-4 py-2 bg-white/[0.04] border-b border-white/[0.07] flex items-center gap-2.5 text-xs">
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse"
            aria-hidden="true"
          />
          <span className="text-white/50 flex-1 min-w-0">
            <span className="text-white/75 font-medium truncate">{dbInfo.fileName}</span>
            <span className="mx-1.5 text-white/20">·</span>
            {dbInfo.totalRows.toLocaleString()} students
            <span className="mx-1.5 text-white/20">·</span>
            {dbInfo.headers.length} columns
          </span>
          {hasHistory && (
            <button
              onClick={clearHistory}
              className="flex-shrink-0 text-white/25 hover:text-white/60 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 rounded px-1"
              aria-label="Clear chat history"
              title="Clear chat history"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Phase indicator */}
      {phase !== "idle" && (
        <div
          className="px-4 py-1.5 bg-violet-500/10 border-b border-violet-500/20 flex items-center gap-2 text-xs text-violet-300"
          role="status"
          aria-live="polite"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse flex-shrink-0" aria-hidden="true" />
          {phase === "searching" ? "Searching database…" : "Generating answer…"}
        </div>
      )}

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scrollbar-thin"
        role="list"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* "Did you mean?" suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 pb-2">
          <p className="text-white/30 text-xs mb-1.5">Did you mean:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setSuggestions([]); sendMessage(s); }}
                className="px-3 py-1.5 rounded-full text-xs bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 hover:border-amber-400/50 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label={`Search for ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggestion chips (initial state) */}
      {showSuggestions && (
        <div className="px-4 pb-3">
          <p className="text-white/30 text-xs mb-2 font-medium uppercase tracking-wide">
            {isReady ? "Try asking:" : "Example questions (upload a file first):"}
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Suggested questions"
          >
            {STATIC_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => isReady && sendMessage(s)}
                disabled={!isReady}
                className={`
                  px-3 py-1.5 rounded-full text-xs transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-violet-500
                  ${isReady
                    ? "bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25 hover:border-violet-400/50 active:scale-95 cursor-pointer"
                    : "bg-white/[0.04] border border-white/[0.08] text-white/25 cursor-not-allowed"
                  }
                `}
                aria-label={`Ask: ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mx-4 mb-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm flex items-start gap-2.5"
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
          <p className="flex-1 leading-relaxed">{error}</p>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 text-white/30 hover:text-white/60 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 border-t border-white/[0.07]">
        <div
          className={`
            flex gap-2 items-end bg-white/[0.06] border rounded-2xl px-4 py-3
            transition-all duration-200
            ${isReady
              ? "border-white/[0.12] focus-within:border-violet-500/50 focus-within:bg-white/[0.08]"
              : "border-white/[0.07] opacity-60"
            }
          `}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isReady
                ? "Ask about your class, section, roll number…"
                : "Upload a database first to start chatting"
            }
            disabled={!isReady || isLoading}
            rows={1}
            maxLength={500}
            className="flex-1 bg-transparent text-white/90 placeholder-white/25 resize-none outline-none text-sm leading-relaxed max-h-36 overflow-y-auto disabled:cursor-not-allowed"
            aria-label="Type your question"
            aria-multiline="true"
            style={{ scrollbarWidth: "none" }}
          />

          <div className="flex items-center gap-2 flex-shrink-0">
            {nearLimit && (
              <span
                className={`text-xs tabular-nums ${charCount >= 500 ? "text-red-400" : "text-amber-400/70"}`}
                aria-live="polite"
              >
                {500 - charCount}
              </span>
            )}
            <button
              onClick={() => sendMessage(input)}
              disabled={!isReady || isLoading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 focus:ring-offset-transparent"
              aria-label="Send message"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-white/20 text-xs text-center mt-2 leading-none">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
