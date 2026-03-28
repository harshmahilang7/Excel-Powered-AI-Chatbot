"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import type { ChatMessage } from "@/types";

interface ChatMessageProps {
  message: ChatMessage;
}

function formatTime(ts: number): string {
  if (ts === 0) return "";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:opacity-100"
      aria-label={copied ? "Copied!" : "Copy message"}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

export default function ChatMessageBubble({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const time = formatTime(message.timestamp);

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-end group`}
      role="listitem"
    >
      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          text-xs font-bold select-none
          ${isUser
            ? "bg-violet-600 text-white"
            : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
          }
        `}
        aria-hidden="true"
      >
        {isUser ? "U" : "AI"}
      </div>

      {/* Bubble + timestamp */}
      <div
        className={`flex flex-col gap-1 max-w-[78%] ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`
            relative px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isUser
              ? "bg-violet-600 text-white rounded-tr-sm shadow-lg shadow-violet-900/30"
              : "bg-white/[0.07] border border-white/[0.08] text-white/90 rounded-tl-sm"
            }
          `}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div
              className="
                prose prose-invert prose-sm max-w-none
                prose-p:my-1.5 prose-p:leading-relaxed
                prose-ul:my-1.5 prose-li:my-0.5
                prose-ol:my-1.5
                prose-strong:text-violet-300 prose-strong:font-semibold
                prose-code:text-violet-300 prose-code:bg-white/10
                prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                prose-headings:text-white prose-headings:font-semibold
                prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
              "
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
              {message.isStreaming && (
                <span
                  className="inline-block w-2 h-4 ml-0.5 bg-violet-400 rounded-sm align-text-bottom animate-pulse"
                  aria-hidden="true"
                />
              )}
            </div>
          )}
        </div>

        <div className={`flex items-center gap-1.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          {time && (
            <span
              className="text-white/25 text-xs px-1 tabular-nums"
              aria-label={`Sent at ${time}`}
              suppressHydrationWarning
            >
              {time}
            </span>
          )}
          {!isUser && !message.isStreaming && message.content && (
            <CopyButton text={message.content} />
          )}
        </div>
      </div>
    </div>
  );
}
