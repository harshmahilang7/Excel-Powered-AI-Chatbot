import Fuse, { type IFuseOptions } from "fuse.js";
import type { StudentRow, SearchResult } from "@/types";

export function buildSearchIndex(rows: StudentRow[], headers: string[]) {
  const options: IFuseOptions<StudentRow> = {
    keys: headers.map((h) => ({ name: h, weight: 1 })),
    threshold: 0.3,
    distance: 100,
    minMatchCharLength: 2,
    includeScore: true,
    ignoreLocation: true,
    useExtendedSearch: true,
  };

  return new Fuse(rows, options);
}

// Strip punctuation, remove stop-words, deduplicate
function tokenize(query: string): string[] {
  const STOP_WORDS = new Set([
    "a", "an", "the", "is", "are", "was", "be", "been",
    "i", "my", "me", "we", "our", "you", "your",
    "what", "where", "who", "how", "which", "do",
    "to", "for", "in", "at", "of", "and", "or", "not",
    "can", "please", "help", "tell", "find", "get", "give",
    "hi", "hello", "hey",
  ]);

  return [
    ...new Set(
      query
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 2 && !STOP_WORDS.has(t))
    ),
  ];
}

// Two-pass search: full query first, then per-token if nothing comes back.
// Per-token handles long sentences like "what room does john from cse-a go to?"
export function searchRows(
  fuse: Fuse<StudentRow>,
  query: string,
  topK = 15
): SearchResult[] {
  const fullResults = fuse.search(query.trim(), { limit: topK });
  if (fullResults.length > 0) {
    return fullResults.map((r) => ({ row: r.item, score: r.score ?? 1 }));
  }

  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const rowHits = new Map<StudentRow, number>();
  for (const token of tokens) {
    fuse.search(token, { limit: topK }).forEach((r) => {
      rowHits.set(r.item, (rowHits.get(r.item) ?? 0) + 1);
    });
  }

  return Array.from(rowHits.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([row, hits]) => ({ row, score: 1 - hits / tokens.length }));
}

// Last-resort plain substring scan when Fuse returns nothing
export function fallbackSearch(
  rows: StudentRow[],
  query: string,
  topK = 15
): SearchResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const scored = rows.map((row) => {
    const text = Object.values(row).filter(Boolean).join(" ").toLowerCase();
    const hits = tokens.filter((t) => text.includes(t)).length;
    return { row, hits };
  });

  return scored
    .filter((r) => r.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, topK)
    .map(({ row, hits }) => ({ row, score: 1 - hits / tokens.length }));
}

// Suggest closest name matches when a query returns zero results
export function suggestMatches(
  rows: StudentRow[],
  headers: string[],
  query: string,
  maxSuggestions = 3
): string[] {
  const nameCol = headers.find((h) => /name|student/i.test(h));
  if (!nameCol) return [];

  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  return rows
    .map((row) => {
      const name = String(row[nameCol] ?? "");
      const lower = name.toLowerCase();
      const hits = tokens.filter(
        (t) => lower.includes(t) || t.includes(lower.split(" ")[0]?.toLowerCase() ?? "")
      ).length;
      return { name, hits };
    })
    .filter((c) => c.hits > 0 && c.name)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, maxSuggestions)
    .map((c) => c.name);
}
