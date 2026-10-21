# Change Guide — PostgreSQL data layer

## What shipped (2026-10-21)

The application store (`lib/db.ts`) now has two backends behind one
interface:

| | JSON (default) | PostgreSQL (`DATABASE_URL` set) |
|---|---|---|
| Storage | `data/store.json` | Tables from `db/pg-runtime-schema.sql` |
| Boot | Read file, or seed | Hydrate from PG (`instrumentation.ts` → `lib/db-pg-boot.ts`), or seed into PG if empty |
| Writes | Atomic file replace | Serialised async queue, one transaction per save (`lib/pg.ts`) |
| Tenancy | App code | App code **plus** Postgres RLS for the `kk_runtime` role |

Runtime table shape: one table per collection (`orders`, `inventory`,
`customers`, …), primary key = record id, full record in a `doc` JSONB
column; `config`/`counters` live in `kk_meta`. Shop-scoped tables carry a
generated `shop_id` column (`doc->>'shopId'`) with a `tenant_isolation`
RLS policy: a `kk_runtime` session sees rows only for
`app.current_shop`, or all rows with `app.bypass_rls = 'on'` (the app's own
pool sets this; tenancy is still enforced in application code on every
request). Verify with `node scripts/rls-check.mjs`.

## Verified

Against a real local PostgreSQL 18.4 (embedded binaries) on 2026-10-21:

- `db/schema.sql` + `db/rls_policies.sql` apply cleanly
  (`scripts/apply-schema.mjs`).
- Full API suites pass on the Postgres backend: Phase 1 41/41, Phase 2 57/57.
- State identical across an app restart (data truly lives in Postgres).
- `scripts/rls-check.mjs`: PASS (no-context = 0 rows, scoped = own shop
  only, bypass = all).

## Running with Postgres locally

```bash
# any PostgreSQL 14+; e.g. a local server or a hosted free-tier project
DATABASE_URL=postgres://user:pass@host:5432/kisankendra npm run build
DATABASE_URL=postgres://user:pass@host:5432/kisankendra npm run start
```

The runtime schema is applied automatically on boot. To also install the
normalised production schema in the same database:

```bash
DATABASE_URL=... node scripts/apply-schema.mjs db/schema.sql db/rls_policies.sql
```

## Known trade-offs / migration path to the normalised schema

- The JSONB bridge favours correctness and zero redesign: whole-store
  transactional write-back per save is right for pilot scale (thousands of
  records), not for high-write production. Hot collections (orders,
  inventory, payments) should be migrated first to the normalised tables in
  `db/schema.sql` with per-row SQL in a repository layer behind the same
  route handlers.
- Sessions are stored as records keyed by token in the `sessions` table;
  move them to Redis (or a dedicated table with TTL) at scale.
- Ticket images are files under `data/uploads`; move to object storage
  (e.g. Supabase Storage / S3) for multi-instance deployments — only
  `lib/uploads.ts` changes.
