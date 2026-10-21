# Kisankendra — Test Checklist & Known Limitations

## Automated verification (run 2026-10-21, all green)

Command: `npm run build` (passes), production server on port 3200, then
`BASE_URL=http://localhost:3200 node scripts/test-api.mjs`.

**Result: 41 passed, 0 failed.** Coverage:

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
- [ ] Admin marks Shop C's licences verified and approves it; Shop C's status
      badge updates (it still needs stocked inventory before it can win
      assignments — new-stock onboarding is a Phase 2 workflow)
- [ ] Keyboard navigation: all actions reachable, visible focus outline
- [ ] 200% text zoom: no clipped buttons or overlapping text

## Known limitations (honest list)

1. **Dev data store:** `data/store.json` is single-process JSON. Correct for
   local demo and pilot testing; production must use `db/schema.sql` on
   PostgreSQL/Supabase per the README mapping.
2. **Payments:** Cash on Delivery / manual confirmation only. No gateway is
   integrated; subscription billing UI is a labelled Phase 3 note. No card
   data is collected or stored.
3. **Images:** product tiles are generated CSS/SVG graphics, not photos
   (₹0 asset budget). Ticket image attachments are stored as data URLs in
   the dev store (500 KB cap) — production should use object storage.
4. **Sessions** are server-side records in the dev store; production should
   use the `sessions` table or Supabase Auth with the same role model.
5. **Notifications** are stored records surfaced on the shop dashboard; no
   SMS/WhatsApp sending is integrated (would need a provider and consent
   workflows).
6. **Legal pages** (privacy, terms, grievance) are templates marked as such;
   they need review by qualified counsel and confirmation of the
   seller-of-record/settlement structure before real transactions.
7. **Licence verification** is an admin decision flag by design — it is not
   an automated government-database check.
8. No rate limiting or CAPTCHA in the dev build; add before public exposure.
9. Disease Finder content is curated general reference information in
   original wording — not a diagnostic tool and not a substitute for label
   directions or agriculture-department advice.
