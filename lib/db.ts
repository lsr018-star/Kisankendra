import fs from "fs";
import path from "path";
import type { Store } from "./types";
import { buildSeed } from "./seed";

// Development data store. The production schema lives in db/schema.sql
// (PostgreSQL). This JSON store mirrors the same collections so the Phase 1
// application runs locally with no external services or credentials.
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

declare global {
  // eslint-disable-next-line no-var
  var __kkStore: Store | undefined;
}

export function loadStore(): Store {
  if (globalThis.__kkStore) return globalThis.__kkStore;
  let store: Store;
  if (fs.existsSync(STORE_FILE)) {
    store = JSON.parse(fs.readFileSync(STORE_FILE, "utf-8")) as Store;
  } else {
    store = buildSeed();
    persist(store);
  }
  globalThis.__kkStore = store;
  return store;
}

export function persist(store: Store): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = STORE_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
  fs.renameSync(tmp, STORE_FILE);
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
