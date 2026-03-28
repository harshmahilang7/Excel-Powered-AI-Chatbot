import { Redis } from "@upstash/redis";
import Fuse from "fuse.js";
import type { ParsedExcel, StudentRow } from "@/types";
import { buildSearchIndex } from "./search";

// Falls back to globalThis for local dev if Upstash env vars are not set
const useRedis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = useRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const TTL_SECONDS = 2 * 60 * 60; // 2 hours

// ── Local (dev) fallback ──────────────────────────────────────────────────────

interface LocalSessionData {
  excel: ParsedExcel;
  fuse: Fuse<StudentRow>;
  lastAccessed: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __sessionStore: Map<string, LocalSessionData> | undefined;
}

function localStore(): Map<string, LocalSessionData> {
  if (!globalThis.__sessionStore) globalThis.__sessionStore = new Map();
  return globalThis.__sessionStore;
}

const LOCAL_TTL = TTL_SECONDS * 1000;

// ── Public API ────────────────────────────────────────────────────────────────

export interface SessionData {
  excel: ParsedExcel;
  fuse: Fuse<StudentRow>;
}

export async function saveSession(
  sessionId: string,
  excel: ParsedExcel,
  fuse: Fuse<StudentRow>
): Promise<void> {
  if (redis) {
    // Store only the serialisable excel data; Fuse is rebuilt on retrieval
    await redis.set(`session:${sessionId}`, JSON.stringify(excel), {
      ex: TTL_SECONDS,
    });
  } else {
    localStore().set(sessionId, { excel, fuse, lastAccessed: Date.now() });
  }
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  if (redis) {
    const raw = await redis.get<string>(`session:${sessionId}`);
    if (!raw) return null;

    // redis.get already parses JSON, but handle both string and object
    const excel: ParsedExcel =
      typeof raw === "string" ? (JSON.parse(raw) as ParsedExcel) : (raw as unknown as ParsedExcel);

    const fuse = buildSearchIndex(excel.rows, excel.headers);
    // Refresh TTL on access
    await redis.expire(`session:${sessionId}`, TTL_SECONDS);
    return { excel, fuse };
  }

  const store = localStore();
  const data = store.get(sessionId);
  if (!data) return null;

  if (Date.now() - data.lastAccessed > LOCAL_TTL) {
    store.delete(sessionId);
    return null;
  }

  data.lastAccessed = Date.now();
  return { excel: data.excel, fuse: data.fuse };
}

export async function clearSession(sessionId: string): Promise<void> {
  if (redis) {
    await redis.del(`session:${sessionId}`);
  } else {
    localStore().delete(sessionId);
  }
}

export async function hasSession(sessionId: string): Promise<boolean> {
  return (await getSession(sessionId)) !== null;
}
