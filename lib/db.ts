import fs from "fs";
import os from "os";
import path from "path";
import type { Store } from "./types";
import { buildSeed } from "./seed";

// Development data store. The production schema lives in db/schema.sql
// (PostgreSQL). This JSON store mirrors the same collections so the Phase 1
// application runs locally with no external services or credentials.
//
// Serverless note (verified 2026-10-21 against Vercel's runtime docs):
// Vercel Functions have a READ-ONLY filesystem with only /tmp writable
// (500 MB scratch). Writing to <cwd>/data therefore throws EROFS there and
// would 500 every request, so persistence is best-effort with fallbacks:
//   1. <cwd>/data/store.json   (local dev — unchanged behaviour)
//   2. /tmp/kisankendra-data/store.json (serverless scratch)
//   3. In-memory only (the global store below stays authoritative for the
//      lifetime of a warm instance; persist() never throws)
// On serverless, data resets to the seed on a cold start. That is a demo
// limitation, not silent data loss: a durable store needs the production
// PostgreSQL/Supabase path in db/ (free tier), which is a Phase 2 switch.
const PRIMARY_DIR = path.join(process.cwd(), "data");
const FALLBACK_DIR = path.join(os.tmpdir(), "kisankendra-data");
const CANDIDATE_DIRS = [PRIMARY_DIR, FALLBACK_DIR];

let activeDir: string | null = null;

function storeFileIn(dir: string): string {
  return path.join(dir, "store.json");
}

declare global {
  // eslint-disable-next-line no-var
  var __kkStore: Store | undefined;
}

// Stores saved by earlier phases lack the Phase 2/3 collections and config
// keys. Fill defaults so a dev store.json from Phase 1 keeps working.
export function normaliseStore(store: Store): Store {
  const s = store as unknown as Record<string, unknown>;
  for (const key of ["plans", "subscriptions", "billingRecords", "payments", "refunds", "settlements"]) {
    if (!Array.isArray(s[key])) s[key] = [];
  }
  const cfg = store.config as unknown as Record<string, unknown>;
  if (typeof cfg.nearExpiryDays !== "number") cfg.nearExpiryDays = 45;
  if (typeof cfg.subscriptionGraceDays !== "number") cfg.subscriptionGraceDays = 7;
  if (typeof cfg.paymentProvider !== "string") cfg.paymentProvider = "manual";
  if (typeof cfg.upiId !== "string") cfg.upiId = "kisankendra@demoupi";
  return store;
}

import { pgEnabled, queuePgPersist } from "./pg";

export function loadStore(): Store {
  if (globalThis.__kkStore) return globalThis.__kkStore;
  // Postgres mode: the store is hydrated at boot by instrumentation
  // (lib/db-pg-boot.ts). Reaching here un-hydrated means boot hydration did
  // not run — fail loudly rather than silently serving seed data.
  if (pgEnabled()) {
    throw new Error(
      "DATABASE_URL is set but the store was not hydrated from Postgres. " +
        "Ensure instrumentation.ts is enabled so register() runs at boot.",
    );
  }
  let store: Store | undefined;
  for (const dir of CANDIDATE_DIRS) {
    const file = storeFileIn(dir);
    try {
      if (fs.existsSync(file)) {
        store = JSON.parse(fs.readFileSync(file, "utf-8")) as Store;
        activeDir = dir;
        break;
      }
    } catch {
      // Unreadable candidate — try the next one, then seed.
    }
  }
  if (!store) {
    store = buildSeed();
    persist(store);
  }
  globalThis.__kkStore = normaliseStore(store);
  return store;
}

export function persist(store: Store): void {
  if (pgEnabled()) {
    queuePgPersist(store);
    return;
  }
  const dirs = activeDir ? [activeDir, ...CANDIDATE_DIRS.filter((d) => d !== activeDir)] : CANDIDATE_DIRS;
  const payload = JSON.stringify(store, null, 2);
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const file = storeFileIn(dir);
      const tmp = file + ".tmp";
      fs.writeFileSync(tmp, payload);
      fs.renameSync(tmp, file);
      activeDir = dir;
      return;
    } catch {
      // Read-only or ephemeral filesystem (e.g. Vercel) — try the next
      // candidate. If none work, the in-memory store still serves requests.
    }
  }
}

export function saveStore(): void {
  const store = loadStore();
  persist(store);
}

export function nextSeq(store: Store, key: string, start = 1000): number {
  const current = store.counters[key] ?? start;
  store.counters[key] = current + 1;
  return current + 1;
}

export function audit(
  store: Store,
  actorId: string,
  actorRole: string,
  action: string,
  entity: string,
  entityId: string,
  details: string
): void {
  store.auditLogs.unshift({
    id: "audit_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    actorId,
    actorRole,
    action,
    entity,
    entityId,
    details,
    at: new Date().toISOString(),
  });
  if (store.auditLogs.length > 500) store.auditLogs.length = 500;
}
