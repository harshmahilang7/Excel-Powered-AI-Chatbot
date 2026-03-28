import { NextRequest } from "next/server";
import { getSession } from "@/lib/session-store";
import { searchRows, fallbackSearch, suggestMatches } from "@/lib/search";
import { streamAnswer } from "@/lib/groq";
import type { StreamEvent } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const AGGREGATE_PATTERN =
  /\b(how many|count|total|list all|show all|all students|all names|all records|every student|everyone|entire|full list|complete list)\b/i;

function ndjson(event: StreamEvent): string {
  return JSON.stringify(event) + "\n";
}

function errorStream(message: string, status: number) {
  return new Response(ndjson({ type: "error", message }), {
    status,
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return errorStream("AI service is not configured. Contact the administrator.", 503);
  }

  let body: { query?: unknown; sessionId?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return errorStream("Invalid request format.", 400);
  }

  if (!body || typeof body !== "object") {
    return errorStream("Invalid request format.", 400);
  }

  const { query, sessionId } = body;

  if (!query || typeof query !== "string") {
    return errorStream("Please type a question before sending.", 400);
  }

  const trimmed = query.trim();

  if (trimmed.length === 0) {
    return errorStream("Your message is empty. Please type a question.", 400);
  }
  if (trimmed.length < 2) {
    return errorStream(
      "Your question is too short. Please provide more details (e.g., your name or ID).",
      400
    );
  }
  if (trimmed.length > 500) {
    return errorStream("Your question is too long (max 500 characters). Please shorten it.", 400);
  }

  if (!sessionId || typeof sessionId !== "string" || sessionId.trim().length === 0) {
    return errorStream("Session ID is missing. Please refresh the page.", 400);
  }

  const session = getSession(sessionId.trim());
  if (!session) {
    return errorStream(
      "Your session has expired or no data was found. Please re-upload the file to continue.",
      404
    );
  }

  const isAggregate = AGGREGATE_PATTERN.test(trimmed);
  let matchedRows;
  let suggestions: string[] | undefined;

  if (isAggregate) {
    matchedRows = session.excel.rows.slice(0, 200);
  } else {
    let results = searchRows(session.fuse, trimmed);
    if (results.length === 0) results = fallbackSearch(session.excel.rows, trimmed);
    matchedRows = results.map((r) => r.row);

    if (matchedRows.length === 0) {
      suggestions = suggestMatches(session.excel.rows, session.excel.headers, trimmed);
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: StreamEvent) =>
        controller.enqueue(encoder.encode(ndjson(event)));

      enqueue({
        type: "meta",
        matchedRows: matchedRows.length,
        ...(suggestions?.length ? { suggestions } : {}),
      });

      try {
        const textStream = await streamAnswer(
          trimmed,
          matchedRows,
          session.excel.headers,
          session.excel.totalRows
        );

        for await (const chunk of textStream) {
          enqueue({ type: "chunk", text: chunk });
        }

        enqueue({ type: "done" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("rate") || msg.toLowerCase().includes("limit")) {
          enqueue({ type: "error", message: "The AI service is rate-limited. Please wait a few seconds and try again." });
        } else if (msg.includes("401") || msg.includes("authentication")) {
          enqueue({ type: "error", message: "AI service authentication failed. Contact the administrator." });
        } else {
          enqueue({ type: "error", message: "The AI service is temporarily unavailable. Please try again." });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
