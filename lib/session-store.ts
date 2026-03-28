import type { ParsedExcel, StudentRow } from "@/types";
import Fuse from "fuse.js";

interface SessionData {
  excel: ParsedExcel;
  fuse: Fuse<StudentRow>;
  lastAccessed: number;
}

// globalThis keeps the store alive across Next.js hot-module reloads
// and shared across all route handlers in the same process.
declare global {
  // eslint-disable-next-line no-var
  var __sessionStore: Map<string, SessionData> | undefined;
}

function getStore(): Map<string, SessionData> {
  if (!globalThis.__sessionStore) {
    globalThis.__sessionStore = new Map();
  }
  return globalThis.__sessionStore;
}

const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function saveSession(
  sessionId: string,
  excel: ParsedExcel,
  fuse: Fuse<StudentRow>
) {
  getStore().set(sessionId, { excel, fuse, lastAccessed: Date.now() });
}

export function getSession(sessionId: string): SessionData | null {
  const store = getStore();
  const data = store.get(sessionId);
  if (!data) return null;

  if (Date.now() - data.lastAccessed > TTL_MS) {
    store.delete(sessionId);
    return null;
  }

  data.lastAccessed = Date.now();
  return data;
}

export function clearSession(sessionId: string) {
  getStore().delete(sessionId);
}

export function hasSession(sessionId: string): boolean {
  return getSession(sessionId) !== null;
}
