# Kisankendra — Test Checklist & Known Limitations

## Automated verification (Phase 1 run 2026-10-21; Phase 2/3 re-run 2026-10-21, all green)

Command: `npm run build` (passes), production server on port 3200, then
`KK_BASE=http://localhost:3200 node scripts/test-api.mjs` followed by
`KK_BASE=http://localhost:3200 node scripts/test-phase2.mjs` on the same
freshly-seeded server.

**Result (JSON backend): Phase 1 — 41 passed, 0 failed. Phase 2/3 — 57
passed, 0 failed.** The identical runs against the **PostgreSQL backend**
(`DATABASE_URL` set, real PostgreSQL 18.4): **41/41 and 57/57**, plus
`scripts/rls-check.mjs` PASS and state identical across an app restart.

Phase 2/3 suite coverage (57 checks):

- [x] Batch rows per product/pack; expired batch flagged and unsellable
      (available 0); near-expiry flag at ≤45 days; dashboard alert counts
- [x] Owner creates/edits/adjusts batches; duplicate batch → 409; staff
      without the inventory permission → 403; cross-shop edit → 404
- [x] Staff inventory view redacts cost prices
- [x] **FEFO:** delivery consumes the earliest-expiring valid batch first;
      the expired batch is never touched
- [x] **Onboarding:** admin approves Shop C + verifies licence → Shop C
      stocks a catalogue product → a Babai order is assigned to Shop C
- [x] Reports: sales gross equals the delivered-orders sum; margin rows sum
      to the summary; reconciliation returns expected/collected/outstanding;
      CSV export (header + rows, text/csv); staff without the finance
      permission → 403 on margin + reconciliation; farmer → 403
- [x] Subscriptions: seeded Growth/Active state; staff subscribe → 403;
      admin creates a plan; shop subscribes → billing Pending
- [x] Payments: manual provider creates a payment intent; webhook with a
      bad HMAC signature → 400; valid signature → payment Paid + billing
      Paid; replay is idempotent; refund initiated with a provider refund
      id; duplicate refund → 409; farmer refund → 403
- [x] Settlements: generated from real delivered orders (gross, commission,
      supply due), marked Settled, visible only to the owning shop
- [x] Uploads: PNG accepted and served back as image/png; non-image → 422;
      arbitrary file names → 404; ticket stores the uploaded file reference
- [x] Analytics: 30-day revenue trend; totals shop-scoped (Shop B < all
      shops); repeat-customer rate within 0–100; farmer → 403

Phase 1 coverage (41 checks):

- [x] Farmer login by mobile; wrong password → 401; anonymous API → 401
- [x] Catalogue lists 14 products; availability aggregates approved shops only
- [x] Checkout prices server-side; order assigned to the only shop with
      stock (Shop B); breakdown exact: items ₹549.00, delivery ₹49.00,
      tax 5% ₹27.45, total ₹625.45, supply ₹483.12, commission 8% ₹43.92
- [x] Stock reserved on placement (reserved=1, stock unchanged)
- [x] **Tenant isolation:** Shop A reading Shop B's customer → 404; Shop A's
      lists contain only Shop A data; Shop A reading Shop B's order → 404
- [x] **Staff boundaries:** staff login works; cost prices absent from staff
      inventory and order responses; staff stock adjustment → 403
- [x] Status flow Pending → Accepted → Processing → Ready for Dispatch →
      Out for Delivery → Delivered; stock 20 → 19 and reservation released
      on delivery; illegal jump (Delivered → Processing) → 422
- [x] Reject flow (manual run): reject with no alternative → Unassigned +
      reason + reservation released; reject with alternative → reassigned
      to the other shop, still Pending
- [x] Unserved village → 422 at checkout with a clear message
- [x] Served village, no fulfilling shop → order **Unassigned** with reason
- [x] Admin manual assignment to an ineligible shop → 422
- [x] Farmer cancels an unassigned order
- [x] Public Solution Box submission creates a ticket
- [x] Pending shop (Shop C) sees Pending status; gets no assignments
- [x] Disease Finder search returns curated entries

Page smoke test: all 27 routes return HTTP 200 (home, catalogue, product,
cart, auth, farmer ×5, shop ×6, admin ×7, legal ×5).

Source scan: no stub markers (alert-based placeholders, "coming soon" text,
TODO comments, dummy handlers). Fixture wording like HTML form hint
attributes is ordinary form UX, not stub content.

## Manual checklist (for human QA on a phone)

- [ ] iPhone Safari widths (360–430 px): header, cards, tables scroll cleanly
- [ ] Hindi toggle switches nav, buttons, statuses; choice survives reload
- [ ] Cart persists across reload; quantities and totals update
- [ ] Checkout with a saved address; field-delivery instructions saved
- [ ] Shop owner walks an order to Delivered; farmer tracking updates
- [ ] Admin approves Shop C + verifies licences; Shop C stocks products from
      the onboarding checklist; a Babai order is then assigned to Shop C
- [ ] Farmer home: the three big buttons (Order Again / Track Order /
      Help for Crop) are easy to tap; crop help photo uploads and previews
- [ ] Shop: expiry alerts visible on the dashboard; reports download as CSV;
      subscription page shows plan + billing history
- [ ] Keyboard navigation: all actions reachable, visible focus outline
- [ ] 200% text zoom: no clipped buttons or overlapping text

## Known limitations (honest list)

1. **Data stores:** the JSON dev store is single-process. The PostgreSQL
   backend (`DATABASE_URL`) is implemented and verified, but stores each
   record as JSONB in per-collection tables — durable and RLS-protected,
   with the normalised `db/schema.sql` as the scale target (migration path
   in `docs/CHANGE-GUIDE.md`).
2. **Payments:** COD / manual confirmation is fully live. The Razorpay
   adapter path is code-complete (orders, checkout handoff, signed webhooks,
   refunds) but **not live**: it needs the owner's gateway account, KYC and
   seller-of-record decision (README → "Payments"). No card data is
   collected or stored by the app.
3. **Images:** product artwork is generated SVG packshots, not photos
   (₹0 asset budget). Ticket images are files under `data/uploads` — on
   serverless hosts without durable disk they are ephemeral; production
   should use object storage.
4. **Sessions** are server-side records in the store; at scale move them to
   the `sessions` table with TTL or Redis.
5. **Notifications** are stored records surfaced on the shop dashboard; no
   SMS/WhatsApp sending is integrated (would need a provider and consent
   workflows).
6. **Legal pages** (privacy, terms, grievance) are templates marked as such;
   they need review by qualified counsel and confirmation of the
   seller-of-record/settlement structure before real transactions.
7. **Licence verification** is an admin decision flag by design — it is not
   an automated government-database check.
8. No rate limiting or CAPTCHA in the dev build; add before public exposure.
9. Disease Finder content (17 entries) is curated general reference
   information in original wording — not a diagnostic tool and not a
   substitute for label directions or agriculture-department advice.
