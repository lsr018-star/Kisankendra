import fs from "fs";
import path from "path";
import { Pool, type PoolClient } from "pg";
import type { Store } from "./types";

// PostgreSQL data layer (active when DATABASE_URL is set).
//
// The application keeps its synchronous store interface (lib/db.ts): the
// whole store is hydrated into memory once at server boot (instrumentation
// register()) and every save is written back through a serialised async
// queue as one transaction per save (upsert-merge per collection —
// atomic, so readers never see a half-written state, and a save from a
// stale-hydrated instance can never delete newer records). Collection rows live
// in the tables created by db/pg-runtime-schema.sql: record id as primary
// key, full record as JSONB, generated shop_id + RLS on shop-scoped tables.
//
// Trade-off, stated plainly: this suits pilot scale (thousands of records).
// The normalised production schema (db/schema.sql) remains the long-term
// target; the migration path is documented in docs/CHANGE-GUIDE.md.

export const COLLECTIONS = [
  "users", "shops", "products", "inventory", "stockMovements", "customers",
  "orders", "assignments", "statusHistory", "tickets", "diseases",
  "notifications", "auditLogs", "reminders", "sessions",
  "plans", "subscriptions", "billingRecords", "payments", "refunds", "settlements",
] as const;

export type CollectionName = (typeof COLLECTIONS)[number];

export const TABLE_BY_COLLECTION: Record<CollectionName, string> = {
  users: "users",
  shops: "shops",
  products: "products",
  inventory: "inventory",
  stockMovements: "stock_movements",
  customers: "customers",
  orders: "orders",
  assignments: "assignments",
  statusHistory: "status_history",
  tickets: "tickets",
  diseases: "diseases",
  notifications: "notifications",
  auditLogs: "audit_logs",
  reminders: "reminders",
  sessions: "sessions",
  plans: "plans",
  subscriptions: "subscriptions",
  billingRecords: "billing_records",
  payments: "payments",
  refunds: "refunds",
  settlements: "settlements",
};

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;
let writeChain: Promise<void> = Promise.resolve();

export function pgEnabled(): boolean {
  return typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.length > 0;
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    // The app's own service queries set the RLS bypass flag on each pooled
    // connection; tenancy is enforced in application code on every request.
    // Scoped/external sessions connect as kk_runtime without this flag.
    pool.on("connect", (client: PoolClient) => {
      client.query("set app.bypass_rls = 'on'", () => {});
    });
  }
  return pool;
}

export function ensurePgSchema(): Promise<void> {
  if (!schemaReady) {
    const attempt = (async () => {
      const p = getPool();
      // Fast path: schema already applied (every boot after the first).
      // Running the DDL file on every boot is what caused the 2026-10-23
      // outage: concurrent cold boots took AccessExclusiveLocks for
      // CREATE TABLE and deadlocked each other (SQLSTATE 40P01), failing
      // the instrumentation hook and 500-ing every store-backed route.
      const marker = await p.query<{ t: string | null }>(
        "select to_regclass('public.kk_meta') as t",
      );
      if (marker.rows[0]?.t) return;
      // First boot ever: apply the schema under an advisory lock so only
      // one instance runs DDL; the rest wait, then see the marker.
      const client = await p.connect();
      try {
        await client.query("select pg_advisory_lock(727271)");
        const again = await client.query<{ t: string | null }>(
          "select to_regclass('public.kk_meta') as t",
        );
        if (!again.rows[0]?.t) {
          const sql = fs.readFileSync(
            path.join(process.cwd(), "db", "pg-runtime-schema.sql"),
            "utf8",
          );
          await client.query(sql);
        }
      } finally {
        await client.query("select pg_advisory_unlock(727271)").catch(() => {});
        client.release();
      }
    })();
    // Never cache a failure: a rejected promise kept in schemaReady would
    // brick this instance for its whole lifetime. Reset so the next call
    // retries (boot also retries — see lib/db-pg-boot.ts).
    schemaReady = attempt.catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

// --- Targeted reads -------------------------------------------------------
// Instances hydrate once at boot, so a record created later (e.g. a new
// registration) is missing from an older instance's memory. These helpers
// let auth and order reads fall back to Postgres on a memory miss and
// adopt the record locally, instead of wrongly answering "not found".

export async function fetchUserByIdFromPg(id: string): Promise<Store["users"][number] | null> {
  await ensurePgSchema();
  const res = await getPool().query<{ doc: Store["users"][number] }>(
    "select doc from users where id = $1",
    [id],
  );
  return res.rows[0]?.doc ?? null;
}

export async function fetchUserByIdentifierFromPg(
  identifier: string,
): Promise<Store["users"][number] | null> {
  await ensurePgSchema();
  const res = await getPool().query<{ doc: Store["users"][number] }>(
    "select doc from users where doc->>'mobile' = $1 or lower(doc->>'email') = $1 limit 1",
    [identifier],
  );
  return res.rows[0]?.doc ?? null;
}

export async function fetchOrderByIdFromPg(id: string): Promise<Store["orders"][number] | null> {
  await ensurePgSchema();
  const res = await getPool().query<{ doc: Store["orders"][number] }>(
    "select doc from orders where id = $1",
    [id],
  );
  return res.rows[0]?.doc ?? null;
}

export async function fetchAllOrdersFromPg(): Promise<Store["orders"]> {
  await ensurePgSchema();
  const res = await getPool().query<{ doc: Store["orders"][number] }>(
    "select doc from orders order by id",
  );
  return res.rows.map((r) => r.doc);
}

// Returns the assembled store, or null when Postgres has no data yet
// (first boot — the caller seeds and persists).
export async function hydrateFromPg(): Promise<Store | null> {
  await ensurePgSchema();
  const p = getPool();
  const counts = await p.query<{ n: string }>("select count(*)::text as n from users");
  if (Number(counts.rows[0]?.n ?? 0) === 0) return null;
  const store: Record<string, unknown> = {};
  for (const name of COLLECTIONS) {
    const table = TABLE_BY_COLLECTION[name];
    const res = await p.query<{ doc: unknown }>(`select doc from "${table}" order by id`);
    store[name] = res.rows.map((r) => r.doc);
  }
  const meta = await p.query<{ key: string; doc: unknown }>("select key, doc from kk_meta");
  for (const row of meta.rows) store[row.key] = row.doc;
  return store as unknown as Store;
}

async function persistAll(store: Store): Promise<void> {
  await ensurePgSchema();
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query("begin");
    await client.query("set app.bypass_rls = 'on'");
    // Upsert-merge, NOT truncate+replace: on serverless, several instances
    // hold snapshots hydrated at different times. A truncate+replace save
    // from a stale instance silently deletes records created after its
    // hydration (this is how a live registration vanished on 2026-10-23).
    // Merging by id means a save can never delete another instance's
    // records. Trade-off: a record deleted in one instance's memory is not
    // deleted here (deletions are rare in this app — status changes are
    // updates, not deletes — and sessions no longer rely on store rows).
    for (const name of COLLECTIONS) {
      const table = TABLE_BY_COLLECTION[name];
      const rows = (store[name] as unknown as Record<string, unknown>[]) ?? [];
      // Bulk multi-row upserts: one round-trip per chunk keeps the write
      // queue fast enough that a save lands in well under a second.
      // Row key: most records carry `id`; sessions are keyed by `token`.
      const CHUNK = 400;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        const params: unknown[] = [];
        const tuples = chunk.map((row, j) => {
          const key =
            (typeof row.id === "string" && row.id) ||
            (typeof row.token === "string" && row.token) ||
            `row_${i + j}`;
          params.push(key, JSON.stringify(row));
          return `($${j * 2 + 1}, $${j * 2 + 2}::jsonb)`;
        });
        await client.query(
          `insert into "${table}" (id, doc) values ${tuples.join(", ")} on conflict (id) do update set doc = excluded.doc, updated_at = now()`,
          params,
        );
      }
    }
    // Counters must never roll backwards (a stale instance would reuse
    // order numbers): merge with what is already stored, keeping the max.
    const existing = await client.query<{ doc: Record<string, number> }>(
      "select doc from kk_meta where key = 'counters'",
    );
    const mergedCounters: Record<string, number> = { ...(store.counters ?? {}) };
    for (const [k, v] of Object.entries(existing.rows[0]?.doc ?? {})) {
      if (typeof v === "number") mergedCounters[k] = Math.max(mergedCounters[k] ?? 0, v);
    }
    await client.query(
      "insert into kk_meta (key, doc) values ('config', $1::jsonb), ('counters', $2::jsonb) on conflict (key) do update set doc = excluded.doc, updated_at = now()",
      [JSON.stringify(store.config), JSON.stringify(mergedCounters)],
    );
    await client.query("commit");
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

// Serialised fire-and-forget persistence used by lib/db.ts save points. The
// snapshot is deep-cloned at queue time so later in-memory mutations cannot
// leak into an in-flight write. Errors are logged, never swallowed silently.
export function queuePgPersist(store: Store): void {
  const snapshot = JSON.parse(JSON.stringify(store)) as Store;
  writeChain = writeChain.then(() => persistAll(snapshot)).catch((e) => {
    console.error("[pg] persist failed:", e instanceof Error ? e.message : e);
  });
}

// Await all queued writes (used by scripts/shutdown paths and tests).
export async function flushPgWrites(): Promise<void> {
  await writeChain;
}
