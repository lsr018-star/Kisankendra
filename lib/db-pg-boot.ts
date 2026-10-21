import { buildSeed } from "./seed";
import { normaliseStore, persist } from "./db";
import { hydrateFromPg, flushPgWrites } from "./pg";
import type { Store } from "./types";

// Boot-time hydration for Postgres mode, called from instrumentation.ts
// register() before the server takes requests. If Postgres is empty, the
// demo seed is written through the normal persist path so the first boot
// behaves exactly like the JSON store's first boot.
export async function bootPgStore(): Promise<void> {
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
}
