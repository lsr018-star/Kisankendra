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
# JSON store backend (default):
npm run start -- -p 3200 &
KK_BASE=http://localhost:3200 node scripts/test-api.mjs       # Phase 1 suite: 41 checks
KK_BASE=http://localhost:3200 node scripts/test-phase2.mjs     # Phase 2/3 suite: 57 checks

# PostgreSQL backend (same suites):
DATABASE_URL=postgres://user:pass@host:5432/db npm run start -- -p 3200 &
# (apply db/schema.sql + db/rls_policies.sql to that database once with
#  scripts/apply-schema.mjs; the app creates its runtime tables itself)
```

Verified 2026-10-21: **41/41 + 57/57 on both backends**; PostgreSQL runs
were against a real PostgreSQL 18.4 server — see `docs/TEST_CHECKLIST.md`.

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
  db.ts         store interface + JSON persistence; delegates to lib/pg.ts when DATABASE_URL is set
  pg.ts         PostgreSQL data layer (hydrate on boot, transactional write-back, RLS-aware)
  seed.ts       fictional demo dataset, created on first run
  auth.ts       scrypt password hashing, httpOnly cookie sessions
  assignment.ts order-assignment engine (eligibility, scoring, FEFO stock reservation)
  orders.ts     order serialisation with cost redaction for staff without finance permission
  products.ts   catalogue serialisation with live, expiry-aware availability
  reports.ts    sales / margin / reconciliation reports from real order + payment data
  subscriptions.ts  plan subscriptions with time-derived Active/Grace/Expired status
  settlements.ts    period settlements (gross, commission, supply due) per shop
  analytics.ts  revenue trend, top products/villages, repeat rate, order funnel
  payments/     provider adapter layer (manual UPI/COD provider live; Razorpay path ready)
  uploads.ts    ticket image files under data/uploads, served by /api/uploads/[name]
  i18n.ts       English/Hindi dictionary (Devanagari) + order-status labels
  money.ts      integer-paise money helpers and ₹ formatting
  villages.ts   launch service-area list
db/
  schema.sql        production PostgreSQL schema (all tables, FKs, indexes)
  rls_policies.sql  row-level-security policies for per-shop isolation (normalised schema)
  pg-runtime-schema.sql  runtime tables used by lib/pg.ts + tenant RLS policies
scripts/          test-api.mjs (Phase 1), test-phase2.mjs (Phase 2/3), apply-schema.mjs, rls-check.mjs
docs/             admin / shop / farmer guides, test checklist, change guide
```

### Data layer: JSON dev store or PostgreSQL (env switch)

The store interface in `lib/db.ts` has two backends:

- **JSON (default, zero setup):** `data/store.json` with write-through
  persistence — for local development and demos.
- **PostgreSQL (set `DATABASE_URL`):** `lib/pg.ts` hydrates the store from
  PostgreSQL at server boot (`instrumentation.ts`) and writes every save
  back as one transaction. Runtime tables are created automatically from
  `db/pg-runtime-schema.sql` (one table per collection; the full record as
  JSONB; a generated `shop_id` column on shop-scoped tables with **row-level
  security** tenant policies for the restricted `kk_runtime` role). If the
  database is empty, the demo seed is written into it on first boot.

**Verified on a real PostgreSQL 18.4 server (2026-10-21):** the shipped
`db/schema.sql` + `db/rls_policies.sql` apply cleanly; the full API suites
pass on the Postgres backend (41/41 + 57/57); application state is identical
across a server restart; and `scripts/rls-check.mjs` proves a scoped
database session sees only its own shop's rows.

For a hosted pilot, any PostgreSQL works (e.g. the Supabase free tier, ₹0 —
creating that account is an owner step). The normalised schema in
`db/schema.sql` remains the long-term production target; the migration path
from the runtime bridge tables is documented in `docs/CHANGE-GUIDE.md`.

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

**Honest limitation:** on Vercel *without* a database, the demo data is
ephemeral — it resets to the seed data (demo logins in the guides) whenever
the function cold-starts. That is fine for trying the full flow, but it is
not durable storage. For a durable pilot, set `DATABASE_URL` to any hosted
PostgreSQL (e.g. a Supabase free-tier project, ₹0 — creating that account is
an owner-only step) and the same deployment becomes durable; the PostgreSQL
data layer is implemented and verified (see "Data layer" above).

## Payments: provider adapters, and going live with a gateway

Payments run through an adapter layer (`lib/payments/`): a common provider
interface, a payment service (payment records, idempotent webhook handling,
refunds, settlement ledger), and two providers:

- **`manual` (default, live now):** COD / cash / UPI-reference payments. The
  shop records a payment claim (UPI reference or COD note) and an admin
  confirms it; subscription bills can also be confirmed by a **signed
  webhook** (HMAC-SHA256 over the raw body, `MANUAL_WEBHOOK_SECRET`).
- **`razorpay` (code-complete, awaiting owner keys):** real Razorpay order
  creation, Checkout handoff (key id returned to the client), webhook
  signature verification (HMAC-SHA256 with the webhook secret), refunds via
  the provider API. It activates by configuration only — **no code changes**:

### Owner steps to switch the gateway on

1. Open a Razorpay (or equivalent) business account and complete **KYC**
   (business PAN/GST, bank account, authorised signatory). Only the account
   owner can do this.
2. Decide the **seller-of-record / settlement model** with a CA/legal
   advisor: marketplace settlement to shops vs. shops as direct merchants.
   The ledger records either way, but payouts and invoicing must match the
   legal model before real money moves.
3. Set the environment variables (see `.env.example`): `RAZORPAY_KEY_ID`,
   `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and set the platform
   config `paymentProvider` to `razorpay` (Admin → Config).
4. Register the webhook URL `<your-domain>/api/payments/webhook?provider=razorpay`
   in the gateway dashboard with the same webhook secret.
5. Set a strong `MANUAL_WEBHOOK_SECRET` if the manual webhook endpoint stays
   reachable (the built-in development default must not be used publicly).

Until then the platform runs fully on COD/manual confirmation — nothing is
blocked, and no real money touches the gateway code path in demo mode.

## Roadmap

- **Phase 1 (done):** public site, auth, farmer marketplace + tracking,
  shop ERP/CRM (customers, Customer 360, inventory basics, orders, reminders),
  assignment engine, admin console, EN/HI.
- **Phase 2 (done):** batch + expiry inventory with FEFO consumption and
  expiry/low-stock alerts, new-shop onboarding (approve → licence → stock →
  assignments), reports pack (sales/margin/reconciliation + CSV),
  subscription plans with billing + manual confirmation.
- **Phase 3 (buildable parts done):** payment-provider adapter layer with a
  complete Razorpay-style path (**ready, awaiting owner keys/KYC** — see
  above), settlements + refund records, advanced analytics (revenue trend,
  top products/villages, repeat-customer rate, order funnel), crop-support
  image uploads as files with previews, Disease Finder expanded to 17
  entries, PostgreSQL data layer behind an env switch.
- **Owner-gated remainder:** live gateway account + KYC + seller-of-record
  decision; a hosted PostgreSQL account (e.g. Supabase) for durable public
  deployment; legal review of the template legal pages.

## Known limitations

See `docs/TEST_CHECKLIST.md` for the full list. Headlines: the JSON dev
store is single-process (use the PostgreSQL backend for anything real);
the PostgreSQL runtime layer stores each record as JSONB in per-collection
tables — durable and RLS-protected, but the fully normalised schema remains
the scale target (migration path in `docs/CHANGE-GUIDE.md`); the payment
gateway is adapter-ready but not live (no gateway account/KYC yet — COD and
manual confirmation work fully); ticket images are stored on the server's
local disk (ephemeral on serverless hosts without a volume/object store);
product imagery is generated SVG artwork, not photographs; the legal pages
are templates pending legal review.
