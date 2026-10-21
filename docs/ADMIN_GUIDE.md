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

Follow README → "Data layer": run `db/schema.sql` + `db/rls_policies.sql` on
PostgreSQL/Supabase (free tier is enough for a pilot), set the env vars from
`.env.example`, and replace the demo admin password immediately.
