import { Redis } from "@upstash/redis";
import Fuse from "fuse.js";
import type { ParsedExcel, StudentRow } from "@/types";
import { buildSearchIndex } from "./search";

// Lazily create the Redis client so it's never instantiated at build/import time.
// Falls back to globalThis in-memory store for local dev.
let _redis: Redis | null | undefined = undefined;

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    _redis = null;
    return null;
  }
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return _redis;
}

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
  const redis = getRedis();
  if (redis) {
    await redis.set(`session:${sessionId}`, JSON.stringify(excel), {
      ex: TTL_SECONDS,
    });
  } else {
    localStore().set(sessionId, { excel, fuse, lastAccessed: Date.now() });
  }
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.get<string>(`session:${sessionId}`);
    if (!raw) return null;

    const excel: ParsedExcel =
      typeof raw === "string" ? (JSON.parse(raw) as ParsedExcel) : (raw as unknown as ParsedExcel);

    const fuse = buildSearchIndex(excel.rows, excel.headers);
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
  const redis = getRedis();
  if (redis) {
    await redis.del(`session:${sessionId}`);
  } else {
    localStore().delete(sessionId);
  }
}

export async function hasSession(sessionId: string): Promise<boolean> {
  return (await getSession(sessionId)) !== null;
}
