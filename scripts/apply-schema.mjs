// Applies SQL files to the database named by DATABASE_URL:
//   node scripts/apply-schema.mjs db/schema.sql db/rls_policies.sql db/pg-runtime-schema.sql
// Used to prove the shipped production schema + RLS execute cleanly and to
// prepare a database manually. Requires the `pg` dependency (installed).
import fs from "fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Pass at least one .sql file");
  process.exit(1);
}
const client = new pg.Client({ connectionString: url });
await client.connect();
for (const file of files) {
  const sql = fs.readFileSync(file, "utf8");
  try {
    await client.query(sql);
    console.log(`APPLIED ${file}`);
  } catch (e) {
    console.error(`FAILED ${file}: ${e.message}`);
    process.exitCode = 1;
    break;
  }
}
await client.end();
