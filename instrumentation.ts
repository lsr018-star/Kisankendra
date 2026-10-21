// Next.js instrumentation: runs once at server boot. When DATABASE_URL is
// set, hydrate the store from PostgreSQL before requests are served.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.DATABASE_URL) return;
  const { bootPgStore } = await import("./lib/db-pg-boot");
  await bootPgStore();
  console.log("[pg] store hydrated from PostgreSQL");
}
