# Kisankendra — Administrator Guide

Login: `admin@kisankendra.in` (demo). The admin console is at `/admin`.

## Daily operations

1. **Dashboard** (`/admin`) — user/shop/order counts, unassigned orders that
   need attention, orders by status, and the latest audit-log entries.
2. **Shop verification** (`/admin/shops`) — new shops register as **Pending**.
   - Check the shop's documents through your verification process.
   - Set status: Pending → Under Review → **Approved** (or Rejected/Suspended).
   - Use **Mark Licences Verified** only after the pesticide and fertilizer
     licences have actually been verified. A shop cannot receive orders for
     regulated products until it is Approved **and** licence-verified, no
     matter what numbers it typed at registration.
3. **Catalogue moderation** (`/admin/products`) — deactivate a product to
   remove it from the farmer catalogue immediately.
4. **Order monitoring** (`/admin/orders`) — every order with its financial
   breakdown (items total, shop supply total, platform commission). For an
   **Unassigned** order, choose an eligible Approved shop and click Assign;
   the system refuses shops that do not serve the village, lack verified
   licences, or lack full stock.
5. **Support tickets** (`/admin/tickets`) — Solution Box and crop-assistance
   requests. Assign to an expert by name, respond (the farmer sees responses
   in their account), and Close when resolved.
6. **Financial configuration** (`/admin/config`) — platform commission %,
   delivery fee, tax %, low-stock threshold and the refund note shown at
   checkout. Changes apply to new orders immediately; existing orders keep
   the breakdown recorded at placement.
7. **Users** (`/admin/users`) — account list by role.

## Rules to respect

- Never mark a licence verified from the registration form alone.
- Never edit an order's price — if a shop cannot honour a price, the order
  is reassigned or cancelled with the customer informed.
- Audit logs are your evidence trail; check them when something looks wrong.

## Going to production

Follow README → "Data layer": the PostgreSQL backend is implemented —
create any PostgreSQL database (a Supabase free-tier project is enough for
a pilot), set `DATABASE_URL` from `.env.example`, optionally apply
`db/schema.sql` + `db/rls_policies.sql` with `scripts/apply-schema.mjs`,
and replace the demo admin password immediately.

## Plans, settlements & analytics (Phase 2/3)

- **Subscription Plans** — create/edit plans (name in EN + HI, price,
  period, features), assign a plan to a shop, confirm or cancel billing
  records, and cancel subscriptions. A shop's status (Active/Grace/
  Expired) is derived from its period end and the configured grace days.
- **Reports** — the shop reports pack across all shops or one shop, with a
  per-shop breakdown and CSV export.
- **Settlements** — generate a period settlement for a shop from its
  delivered orders (gross, commission, supply due) and mark it Settled when
  paid out. Refunds are initiated from **Payments** on an order (Admin →
  Settlements lists recent payment records).
- **Analytics** — platform-wide or per-shop revenue trend (30 days), top
  products, top villages, repeat-customer rate and the order funnel.
- **Payments go-live** is an owner task (gateway account + KYC +
  seller-of-record decision) — README → "Payments" lists the exact steps.
  Until then everything runs on COD/manual confirmation.
