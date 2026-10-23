import { buildSeed } from "./seed";
import { normaliseStore, persist } from "./db";
import { hydrateFromPg, flushPgWrites } from "./pg";
import type { Store } from "./types";

// Boot-time hydration for Postgres mode, called from instrumentation.ts
// register() before the server takes requests. If Postgres is empty, the
// demo seed is written through the normal persist path so the first boot
// behaves exactly like the JSON store's first boot.
export async function bootPgStore(): Promise<void> {
  // Boot must survive transient database contention: when many serverless
  // instances cold-boot together (deploy, idle wake), their transactions
  // can deadlock (SQLSTATE 40P01 — this took the live site down on
  // 2026-10-23). A deadlock is momentary, so retry with backoff instead
  // of letting the instrumentation hook fail the whole instance.
  const delays = [0, 400, 1200, 2500];
  let lastError: unknown = null;
  for (const delay of delays) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    try {
      const hydrated = await hydrateFromPg();
      if (hydrated) {
        globalThis.__kkStore = normaliseStore(hydrated);
        return;
      }
      const seed: Store = buildSeed();
      globalThis.__kkStore = normaliseStore(seed);
      persist(seed);
      await flushPgWrites();
      console.log("[pg] empty database — seeded demo data into Postgres");
      return;
    } catch (e) {
      lastError = e;
      console.error(
        "[pg] boot hydration attempt failed, will retry:",
        e instanceof Error ? e.message : e,
      );
    }
  }
  throw lastError;
}
