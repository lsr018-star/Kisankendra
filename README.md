# Kisankendra — Agricultural Marketplace + Partner-Shop ERP/CRM

**Kisan ka Saathi, Har Khet ke Liye.**

Kisankendra is a working web application for Seoni Malwa and nearby villages
(Narmadapuram district, Madhya Pradesh) that combines:

1. A farmer-facing agricultural product ordering marketplace.
2. A partner-shop fulfilment network (orders are auto-assigned to eligible
   licensed shops by stock, service area and capacity).
3. An ERP/CRM for each partner shop (customers, inventory, orders, reminders).
4. A central admin dashboard (shop verification, catalogue moderation,
   financial configuration, support, audit logs).

The seller of record is the assigned partner shop (shown on the order and
invoice). Kisankendra records the shop supply price, platform commission and
customer selling price separately on every order — they are never conflated.

---

## Quick start (local development, ₹0 cost)

```bash
npm install
npm run dev        # http://localhost:3000
# or production mode:
npm run build
npm run start -- -p 3200
```

No accounts, keys or paid services are needed for local development. On the
first run the app seeds a fictional demo dataset automatically.

### Demo credentials (all fictional)

| Role | Login | Password |
|---|---|---|
| Farmer | mobile `9876543210` (or `ramesh@demo.in`) | `farmer123` |
| Farmer 2 | mobile `9876501234` | `farmer123` |
| Shop A owner — Sharma Krishi Seva Kendra (Approved, verified) | `shopa@kisankendra.in` | `shop123` |
| Shop A staff (orders + customers only, no cost prices) | `staffa@kisankendra.in` | `staff123` |
| Shop B owner — Verma Agro Centre (Approved, verified) | `shopb@kisankendra.in` | `shop123` |
| Shop C owner — New Agro Point (Pending approval demo) | `shopc@kisankendra.in` | `shop123` |
| Admin | `admin@kisankendra.in` | `admin123` |

Login accepts email **or** mobile number.

### Verify the build

```bash
npm run build
npm run start -- -p 3200 &
BASE_URL=http://localhost:3200 npm run test:api   # 41 assertions, see docs/TEST_CHECKLIST.md
```

---

## Architecture

```
app/            Next.js App Router pages, grouped by area
  (public)      landing, catalogue, product, cart, faq/privacy/terms/...
  login, register, register/shop
  farmer/       dashboard, orders, order tracking, profile/addresses, support
  shop/         ERP dashboard, customers (+Customer 360), orders, inventory, reminders
  admin/        dashboard, shops, products, orders, tickets, users, config
  api/          Route handlers — ALL authorisation is enforced here, server-side
components/     Header, Footer, ProductCard, ShopNav, AdminNav, providers
lib/
  db.ts         development JSON store (data/store.json) with write-through persistence
  seed.ts       fictional demo dataset, created on first run
  auth.ts       scrypt password hashing, httpOnly cookie sessions
  assignment.ts order-assignment engine (eligibility, scoring, stock reservation)
  orders.ts     order serialisation with cost redaction for staff without finance permission
  products.ts   catalogue serialisation with live availability
  i18n.ts       English/Hindi dictionary (Devanagari) + order-status labels
  money.ts      integer-paise money helpers and ₹ formatting
  villages.ts   launch service-area list
db/
  schema.sql        production PostgreSQL schema (all tables, FKs, indexes)
  rls_policies.sql  example row-level-security policies for per-shop isolation
scripts/test-api.mjs  end-to-end API verification suite
docs/           admin / shop / farmer guides and the test checklist
```

### Data layer: development store vs production database

Phase 1 runs with **zero external services**: API routes read/write a JSON
store (`data/store.json`, git-ignored runtime state) through `lib/db.ts`.
Collections in the store mirror `db/schema.sql` table-for-table
(users, shops, customers, products, inventory, orders, assignments, ...), so
moving to production is a data-access swap, not a redesign:

1. Create a Supabase (free tier) or any PostgreSQL database.
2. Run `db/schema.sql`, then `db/rls_policies.sql`.
3. Set `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and
   `SESSION_SECRET` (see `.env.example`). Service-role keys are server-only
   and must never reach browser code.
4. Replace the store functions in `lib/db.ts` with SQL/Supabase queries
   keeping the same collection shapes; route handlers and UI do not change.

### Security model

- Passwords: scrypt-hashed with per-user salt; sessions are random tokens in
  httpOnly cookies, stored server-side with expiry.
- Every API handler checks the session role **and** shop tenancy on the
  server. A shop can only ever see its own customers, inventory and orders
  (verified by automated tests: cross-shop reads return 404).
- Financial fields (purchase cost, supply totals, commission) are redacted
  from responses for shop staff without the `finance` permission.
- Stock is reserved at order placement, decremented on delivery, released on
  cancellation/rejection — overselling is prevented by rechecking stock in
  the assignment engine at placement and acceptance.
- Sensitive actions write audit-log entries.

### Order assignment engine (`lib/assignment.ts`)

On checkout: service area is validated → eligible shops = **Approved +
licence verified + serves the village + holds full available stock** →
scored by village priority and open-order load → best shop assigned and
stock reserved → shop must Accept (Reject tries the next eligible shop,
else the order becomes **Unassigned** with a clear customer message and an
admin manual-assignment path). Prices and products are never changed or
substituted silently.

### Money

All amounts are integer **paise**; display uses `₹` en-IN formatting.
Commission %, delivery fee and tax % are admin-configurable
(`/admin/config`) and snapshotted into each order's financial breakdown.

### Languages

English/Hindi toggle in the header; choice persists in `localStorage` and on
the user profile. Navigation, buttons, forms, validation and order statuses
are translated via `lib/i18n.ts`.

---

## Budget & sourcing notes (₹0 build)

- Stack: Next.js + Tailwind (open source), system fonts, no paid APIs, no
  stock-photo or icon packs — product imagery is generated CSS/SVG tiles.
- Hosting for a pilot can use free tiers (e.g. Vercel + Supabase free tier);
  nothing in Phase 1 requires a paid plan.
- Workflows (assignment flow, ERP dashboard layout, catalogue taxonomy) were
  modelled on patterns publicly documented by established agri-marketplace
  and retailer apps and public agricultural-extension knowledge, implemented
  in original code and wording. Disease-library entries are original text
  written from general public agricultural knowledge and are labelled
  reference information, not diagnoses. No proprietary code, text, images or
  branding from any app is included.

## GitHub readiness

The repo is push-ready: `.gitignore` excludes `node_modules/`, `.next/`,
`.env*` and the runtime `data/store.json` (demo state is regenerated from
`lib/seed.ts` on first run, so a fresh clone seeds itself). No secrets are
committed; `.env.example` lists names only. The user provides their GitHub
remote at delivery time — no push is attempted by the build.

## Deploying to Vercel (free tier)

Import the GitHub repo in Vercel (framework preset: Next.js, no build
settings to change, no env vars needed for the Phase 1 demo) and deploy —
that produces the public URL.

**Verified serverless fix (2026-10-21):** Vercel Functions have a read-only
filesystem with only `/tmp` writable. `lib/db.ts` therefore persists
best-effort: local `data/store.json` first, then `/tmp/kisankendra-data/`
on serverless, then in-memory only — a failed write can never crash a
request. Verified by build + the full 41-test API suite locally, plus a
sabotaged-primary-path run (products/login/home all 200, store written to
`/tmp`).

**Honest limitation:** on Vercel the demo data is ephemeral — it resets to
the seed data (demo logins in the guides) whenever the function cold-starts.
That is fine for trying the full flow, but it is not durable storage. For a
real pilot, switch to the production PostgreSQL schema in `db/` on the
Supabase free tier (₹0) — that is the Phase 2 step, and it needs the
project owner's Supabase account credentials.

## Roadmap

- **Phase 1 (this build):** public site, auth, farmer marketplace + tracking,
  shop ERP/CRM (customers, Customer 360, inventory basics, orders, reminders),
  assignment engine, admin console, EN/HI.
- **Phase 2:** richer inventory (batch/expiry workflows), reports pack
  (sales/margin/reconciliation + CSV — basic order/customer CSV export already
  works), subscription plans.
- **Phase 3:** payment gateway + settlement/refund automation (only after the
  seller-of-record and settlement model is legally confirmed), advanced
  analytics, image-based crop support enhancements.

## Known limitations

See `docs/TEST_CHECKLIST.md` for the full list. Headlines: JSON dev store is
single-process and not for production scale; payments are Cash-on-Delivery /
manual confirmation (no gateway yet); product images are generated tiles,
not photographs; the legal pages are templates pending legal review.
