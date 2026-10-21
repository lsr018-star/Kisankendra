// Kisankendra Phase 2/3 API test suite.
// Run AFTER scripts/test-api.mjs against the same freshly-seeded server:
//   KK_BASE=http://127.0.0.1:3200 node scripts/test-phase2.mjs
// Covers: batch/expiry inventory (one row per batch) + FEFO delivery,
// new-shop stocking -> assignment, reports + CSV + staff finance gates,
// subscription lifecycle + billing, payment provider flow (create, signed
// webhook over the raw body, replay, refund), settlements, file uploads +
// ticket images, analytics scoping.
import crypto from "crypto";

const BASE = process.env.KK_BASE ?? "http://127.0.0.1:3200";
let passed = 0;
let failed = 0;

function check(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name} ${extra}`);
  }
}

async function call(method, path, { cookie, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

async function login(identifier, password) {
  const r = await call("POST", "/api/auth/login", { body: { identifier, password } });
  if (r.status !== 200) throw new Error(`login ${identifier} failed: ${r.status}`);
  const setCookie = r.headers.getSetCookie?.() ?? [];
  return { cookie: setCookie.map((c) => c.split(";")[0]).join("; "), user: r.data.user };
}

async function registerFarmer(name, mobile, village) {
  const r = await call("POST", "/api/auth/register/farmer", {
    body: { name, mobile, email: "", password: "farmer123", village },
  });
  if (r.status !== 201 && r.status !== 200) throw new Error(`register ${mobile} failed: ${r.status} ${JSON.stringify(r.data)}`);
  return login(mobile, "farmer123");
}

async function placeOrder(cookie, items, village, mobile, name) {
  return call("POST", "/api/orders", {
    cookie,
    body: {
      items,
      customerName: name,
      mobile,
      village,
      addressLine: `Test address, ${village}`,
      deliveryType: "home",
      paymentMethod: "COD",
    },
  });
}

async function walkToDelivered(cookie, orderId) {
  const steps = [
    { action: "accept" },
    { action: "status", status: "Processing" },
    { action: "status", status: "Ready for Dispatch" },
    { action: "status", status: "Out for Delivery" },
    { action: "status", status: "Delivered" },
  ];
  for (const step of steps) {
    const r = await call("PATCH", `/api/orders/${orderId}`, { cookie, body: step });
    if (r.status !== 200) throw new Error(`walk ${orderId} ${JSON.stringify(step)} -> ${r.status} ${JSON.stringify(r.data)}`);
  }
}

async function main() {
  console.log(`Testing Kisankendra Phase 2/3 at ${BASE}\n`);
  const admin = await login("admin@kisankendra.in", "admin123");
  const shopA = await login("shopa@kisankendra.in", "shop123");
  const staffA = await login("staffa@kisankendra.in", "staff123");
  const shopB = await login("shopb@kisankendra.in", "shop123");
  const shopC = await login("shopc@kisankendra.in", "shop123");
  const farmer = await login("9876543210", "farmer123");

  // ---------- Batch rows, expiry, alerts ----------
  const invA = await call("GET", "/api/shop/inventory", { cookie: shopA.cookie });
  const rowsA2 = invA.data.inventory.filter((l) => l.productId === "prod_2" && l.packSize === "100 g");
  const validRow = rowsA2.find((l) => l.batch === "A-2402");
  const expiredRow = rowsA2.find((l) => l.batch === "A-2390");
  check("prod_2 held as separate batch rows at Shop A", rowsA2.length === 2, `rows=${rowsA2.length}`);
  check("expired batch flagged and unsellable (available 0)", !!expiredRow && expiredRow.expired === true && expiredRow.available === 0, JSON.stringify(expiredRow));
  check("valid batch available (3)", !!validRow && validRow.available === 3, JSON.stringify(validRow));
  check("expiry alerts count the expired batch", invA.data.alerts.expired >= 1, JSON.stringify(invA.data.alerts));
  const nearRow = invA.data.inventory.find((l) => l.batch === "A-2511");
  check("near-expiry batch flagged (A-2511, exp 2026-11-20)", !!nearRow && nearRow.nearExpiry === true, JSON.stringify(nearRow));
  check("owner sees cost prices on inventory rows", invA.data.inventory.every((l) => typeof l.costPaise === "number"));
  const invStaff = await call("GET", "/api/shop/inventory", { cookie: staffA.cookie });
  check("staff inventory view redacts costPaise", invStaff.data.inventory.length > 0 && invStaff.data.inventory.every((l) => !("costPaise" in l)));

  const in30d = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const createBatch = await call("POST", "/api/shop/inventory", {
    cookie: shopA.cookie,
    body: { action: "create", productId: "prod_1", packSize: "500 ml", batch: "TEST-NEW", expiry: in30d, stock: 4, costPaise: 40000 },
  });
  check("owner can add a new batch line (201)", createBatch.status === 201 && createBatch.data.inventory?.batch === "TEST-NEW", JSON.stringify(createBatch.data).slice(0, 200));
  const dupBatch = await call("POST", "/api/shop/inventory", {
    cookie: shopA.cookie,
    body: { action: "create", productId: "prod_1", packSize: "500 ml", batch: "TEST-NEW", expiry: in30d, stock: 1, costPaise: 1 },
  });
  check("duplicate batch rejected (409)", dupBatch.status === 409, `got ${dupBatch.status}`);
  const newRowId = createBatch.data.inventory.id;
  const upd = await call("POST", "/api/shop/inventory", {
    cookie: shopA.cookie,
    body: { action: "update", inventoryId: newRowId, expiry: "2027-01-15" },
  });
  check("owner can edit a batch expiry", upd.status === 200 && upd.data.inventory.expiry === "2027-01-15");
  const adj = await call("POST", "/api/shop/inventory", {
    cookie: shopA.cookie,
    body: { inventoryId: newRowId, delta: 2, reason: "Cycle count correction (test)" },
  });
  check("stock adjustment applies (+2 -> 6)", adj.status === 200 && adj.data.stock === 6, JSON.stringify(adj.data));
  const staffCreate = await call("POST", "/api/shop/inventory", {
    cookie: staffA.cookie,
    body: { action: "create", productId: "prod_1", packSize: "500 ml", batch: "STAFF-X", expiry: in30d, stock: 1, costPaise: 1 },
  });
  check("staff without inventory permission cannot create batches (403)", staffCreate.status === 403, `got ${staffCreate.status}`);
  const crossCreate = await call("POST", "/api/shop/inventory", {
    cookie: shopB.cookie,
    body: { action: "update", inventoryId: newRowId, expiry: "2028-01-01" },
  });
  check("shop B cannot edit shop A's batch (404)", crossCreate.status === 404, `got ${crossCreate.status}`);

  // ---------- FEFO delivery: earliest valid expiry first, expired never ----------
  const fefo = await placeOrder(farmer.cookie, [{ productId: "prod_2", packSize: "100 g", qty: 2 }], "Seoni Malwa", "9876543210", "Ramesh Patel");
  check("FEFO order assigned to Shop A", fefo.status === 201 && fefo.data.order.shopId === "shop_a", JSON.stringify(fefo.data).slice(0, 200));
  const fefoOrderId = fefo.data.order.id;
  await walkToDelivered(shopA.cookie, fefoOrderId);
  const invA2 = await call("GET", "/api/shop/inventory", { cookie: shopA.cookie });
  const validAfter = invA2.data.inventory.find((l) => l.batch === "A-2402");
  const expiredAfter = invA2.data.inventory.find((l) => l.batch === "A-2390");
  check("FEFO: earliest valid batch decremented 3 -> 1", validAfter.stock === 1, `stock=${validAfter?.stock}`);
  check("FEFO: expired batch untouched (6)", expiredAfter.stock === 6, `stock=${expiredAfter?.stock}`);

  // ---------- New-shop onboarding: approve -> stock -> assignment ----------
  const approve = await call("PATCH", "/api/admin/shops/shop_c", {
    cookie: admin.cookie,
    body: { status: "Approved", verifyLicence: true },
  });
  check("admin approves Shop C and verifies its licence", approve.status === 200 && approve.data.shop?.status === "Approved" && approve.data.shop?.licences?.verified === true, JSON.stringify(approve.data).slice(0, 160));
  const stockC = await call("POST", "/api/shop/inventory", {
    cookie: shopC.cookie,
    body: { action: "create", productId: "prod_1", packSize: "250 ml", batch: "C-1", expiry: "2027-06-01", stock: 25, costPaise: 20000 },
  });
  check("approved Shop C can stock a catalogue product (201)", stockC.status === 201, JSON.stringify(stockC.data).slice(0, 200));
  const babai = await registerFarmer("Babai Test", "9822222222", "Babai");
  const babaiOrder = await placeOrder(babai.cookie, [{ productId: "prod_1", packSize: "250 ml", qty: 1 }], "Babai", "9822222222", "Babai Test");
  check("Babai order now assigned to Shop C", babaiOrder.status === 201 && babaiOrder.data.order.shopId === "shop_c", JSON.stringify(babaiOrder.data).slice(0, 200));

  // ---------- Reports ----------
  const from = new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);
  const sales = await call("GET", `/api/shop/reports?type=sales&from=${from}&to=${to}`, { cookie: shopA.cookie });
  const rep = sales.data.report ?? {};
  const deliveredSum = (rep.orders ?? []).filter((o) => o.status === "Delivered").reduce((s, o) => s + o.totalPaise, 0);
  check("sales report gross equals delivered orders sum", sales.status === 200 && rep.summary?.grossPaise === deliveredSum && deliveredSum > 0, `gross=${rep.summary?.grossPaise} sum=${deliveredSum}`);
  const marginStaff = await call("GET", `/api/shop/reports?type=margin&from=${from}&to=${to}`, { cookie: staffA.cookie });
  check("staff without finance blocked from margin report (403)", marginStaff.status === 403, `got ${marginStaff.status}`);
  const reconStaff = await call("GET", `/api/shop/reports?type=reconciliation&from=${from}&to=${to}`, { cookie: staffA.cookie });
  check("staff without finance blocked from reconciliation (403)", reconStaff.status === 403);
  const salesStaff = await call("GET", `/api/shop/reports?type=sales&from=${from}&to=${to}`, { cookie: staffA.cookie });
  check("staff can read the sales report", salesStaff.status === 200);
  const marginA = await call("GET", `/api/shop/reports?type=margin&from=${from}&to=${to}`, { cookie: shopA.cookie });
  const mRep = marginA.data.report ?? {};
  const marginRowsSum = (mRep.orders ?? []).reduce((s, o) => s + o.marginPaise, 0);
  check("margin report rows sum to summary margin", marginA.status === 200 && marginRowsSum === mRep.summary?.marginPaise, `${marginRowsSum} vs ${mRep.summary?.marginPaise}`);
  const reconA = await call("GET", `/api/shop/reports?type=reconciliation&from=${from}&to=${to}`, { cookie: shopA.cookie });
  check("reconciliation report returns expected/collected/outstanding", reconA.status === 200 && typeof reconA.data.report?.summary?.outstandingPaise === "number");
  const csvRes = await fetch(`${BASE}/api/shop/reports?type=sales&from=${from}&to=${to}&format=csv`, { headers: { Cookie: shopA.cookie } });
  const csvText = await csvRes.text();
  check("sales CSV export: csv content type + header + rows", csvRes.status === 200 && (csvRes.headers.get("content-type") ?? "").includes("text/csv") && csvText.startsWith("Order No,") && csvText.split("\n").length > 3, csvText.slice(0, 80));
  const adminReports = await call("GET", `/api/admin/reports?type=sales&from=${from}&to=${to}`, { cookie: admin.cookie });
  check("admin reports include per-shop breakdown (>=3 shops)", adminReports.status === 200 && (adminReports.data.perShop?.length ?? 0) >= 3);
  const farmerReports = await call("GET", `/api/shop/reports?type=sales&from=${from}&to=${to}`, { cookie: farmer.cookie });
  check("farmer cannot read shop reports (403)", farmerReports.status === 403);

  // ---------- Subscriptions ----------
  const subA = await call("GET", "/api/shop/subscription", { cookie: shopA.cookie });
  check("Shop A on Growth plan, status Active", subA.data.current?.planId === "plan_growth" && subA.data.current?.status === "Active", JSON.stringify(subA.data.current));
  check("plan catalogue lists >= 3 active plans", (subA.data.plans?.length ?? 0) >= 3);
  const staffSubscribe = await call("POST", "/api/shop/subscription", { cookie: staffA.cookie, body: { planId: "plan_basic" } });
  check("staff cannot subscribe (owner only, 403)", staffSubscribe.status === 403, `got ${staffSubscribe.status}`);
  const newPlan = await call("POST", "/api/admin/plans", {
    cookie: admin.cookie,
    body: { action: "createPlan", name: "TestPlan", pricePaise: 19900, periodDays: 30, features: ["Test feature"] },
  });
  check("admin can create a plan (201)", newPlan.status === 201 && !!newPlan.data.plan?.id, JSON.stringify(newPlan.data).slice(0, 160));
  const planId = newPlan.data.plan.id;
  const subB = await call("POST", "/api/shop/subscription", { cookie: shopB.cookie, body: { planId } });
  check("Shop B subscribes -> billing Pending", subB.status === 201 && subB.data.billing?.status === "Pending" && subB.data.billing?.amountPaise === 19900, JSON.stringify(subB.data).slice(0, 220));
  const billingId = subB.data.billing.id;

  // ---------- Payments: manual provider + signed webhook ----------
  const payCreate = await call("POST", "/api/payments/create", { cookie: shopB.cookie, body: { billingId } });
  check("manual payment created via provider adapter (201)", payCreate.status === 201 && !!payCreate.data.providerOrderId && payCreate.data.amountPaise === 19900, JSON.stringify(payCreate.data).slice(0, 200));
  const providerOrderId = payCreate.data.providerOrderId;
  const secret = "kk-manual-dev-secret-change-in-production";
  const hookBody = JSON.stringify({ type: "payment.captured", providerOrderId, providerPaymentId: "upi_txn_test_1", status: "captured", amountPaise: 19900 });
  const goodSig = crypto.createHmac("sha256", secret).update(hookBody).digest("hex");
  const badHook = await fetch(`${BASE}/api/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-kk-signature": "deadbeef" },
    body: hookBody,
  });
  check("webhook with invalid signature rejected (400)", badHook.status === 400, `got ${badHook.status}`);
  const goodHook = await fetch(`${BASE}/api/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-kk-signature": goodSig },
    body: hookBody,
  });
  const goodHookData = await goodHook.json().catch(() => ({}));
  check("webhook with valid HMAC signature accepted + matched", goodHook.status === 200 && goodHookData.matched === true, `got ${goodHook.status} ${JSON.stringify(goodHookData)}`);
  const replay = await fetch(`${BASE}/api/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-kk-signature": goodSig },
    body: hookBody,
  });
  check("webhook replay is safe (200, idempotent)", replay.status === 200);
  const subB2 = await call("GET", "/api/shop/subscription", { cookie: shopB.cookie });
  const billRow = subB2.data.billing.find((b) => b.id === billingId);
  check("billing marked Paid by the webhook", billRow?.status === "Paid", `status=${billRow?.status}`);
  check("Shop B current plan is the new plan, Active", subB2.data.current?.planId === planId && subB2.data.current?.status === "Active", JSON.stringify(subB2.data.current));

  const refund = await call("POST", "/api/payments/refund", { cookie: admin.cookie, body: { orderId: fefoOrderId, reason: "Automated test refund" } });
  check("admin initiates refund on delivered order payment", refund.status === 201 && refund.data.refund?.status === "Initiated" && !!refund.data.refund?.providerRefundId, JSON.stringify(refund.data).slice(0, 220));
  const refundFarmer = await call("POST", "/api/payments/refund", { cookie: farmer.cookie, body: { orderId: fefoOrderId } });
  check("farmer cannot initiate refunds (403)", refundFarmer.status === 403, `got ${refundFarmer.status}`);
  const refundDup = await call("POST", "/api/payments/refund", { cookie: admin.cookie, body: { orderId: fefoOrderId } });
  check("duplicate refund blocked (409)", refundDup.status === 409, `got ${refundDup.status}`);

  // ---------- Settlements ----------
  const gen = await call("POST", "/api/admin/settlements", {
    cookie: admin.cookie,
    body: { action: "generate", shopId: "shop_a", from, to },
  });
  check("settlement generated from real orders", gen.status === 201 && gen.data.settlement.grossPaise > 0, JSON.stringify(gen.data).slice(0, 200));
  const st = gen.data.settlement;
  check("settlement supply is the per-order supply sum (0 < supply <= gross - commission)", st.supplyPaise > 0 && st.supplyPaise <= st.grossPaise - st.commissionPaise, `gross=${st.grossPaise} commission=${st.commissionPaise} supply=${st.supplyPaise}`);
  const settle = await call("POST", "/api/admin/settlements", { cookie: admin.cookie, body: { action: "settle", settlementId: st.id } });
  check("admin marks settlement Settled", settle.status === 200 && settle.data.settlement.status === "Settled");
  const shopSettle = await call("GET", "/api/shop/settlements", { cookie: shopA.cookie });
  check("shop A sees its own settlement", shopSettle.data.settlements.some((s) => s.id === st.id));
  const shopBSettle = await call("GET", "/api/shop/settlements", { cookie: shopB.cookie });
  check("shop B cannot see shop A's settlement", !shopBSettle.data.settlements.some((s) => s.id === st.id));

  // ---------- Uploads + ticket images ----------
  const pngBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=", "base64");
  const fd = new FormData();
  fd.append("file", new Blob([pngBytes], { type: "image/png" }), "leaf.png");
  const up = await fetch(`${BASE}/api/uploads`, { method: "POST", body: fd });
  const upData = await up.json().catch(() => ({}));
  check("image upload accepted (201, generated name)", up.status === 201 && /^upl_[a-z0-9]+\.png$/.test(upData.name ?? ""), JSON.stringify(upData));
  const fileRes = await fetch(`${BASE}${upData.url}`);
  check("uploaded image served back as image/png", fileRes.status === 200 && (fileRes.headers.get("content-type") ?? "").includes("image/png"));
  const badFd = new FormData();
  badFd.append("file", new Blob(["hello"], { type: "text/plain" }), "note.txt");
  const badUp = await fetch(`${BASE}/api/uploads`, { method: "POST", body: badFd });
  check("non-image upload rejected (422)", badUp.status === 422, `got ${badUp.status}`);
  const trav = await fetch(`${BASE}/api/uploads/store.json`);
  check("arbitrary file name cannot be served (404)", trav.status === 404, `got ${trav.status}`);
  const tkt = await call("POST", "/api/tickets", {
    cookie: farmer.cookie,
    body: { name: "Ramesh Patel", mobile: "9876543210", crop: "Soybean", village: "Seoni Malwa", description: "Leaf spots test", type: "crop", imageFile: upData.name, imageName: "leaf.png" },
  });
  check("ticket accepts an uploaded image file (201)", tkt.status === 201, JSON.stringify(tkt.data).slice(0, 160));
  const myTickets = await call("GET", "/api/tickets", { cookie: farmer.cookie });
  check("farmer ticket list carries the image file reference", myTickets.data.tickets.some((x) => x.imageFile === upData.name));

  // ---------- Analytics ----------
  const anA = await call("GET", "/api/shop/analytics", { cookie: shopA.cookie });
  check("shop analytics: 30-day trend + totals", anA.status === 200 && anA.data.analytics.revenueTrend.length === 30 && anA.data.analytics.totals.orders >= 5, JSON.stringify(anA.data.analytics?.totals));
  const anAdmin = await call("GET", "/api/admin/analytics", { cookie: admin.cookie });
  const anB = await call("GET", "/api/shop/analytics", { cookie: shopB.cookie });
  check("analytics are shop-scoped (Shop B < all shops)", anB.data.analytics.totals.orders < anAdmin.data.analytics.totals.orders, `B=${anB.data.analytics.totals.orders} all=${anAdmin.data.analytics.totals.orders}`);
  check("repeat-customer rate within 0-100", anAdmin.data.analytics.repeat.ratePct >= 0 && anAdmin.data.analytics.repeat.ratePct <= 100);
  const anFarmer = await call("GET", "/api/admin/analytics", { cookie: farmer.cookie });
  check("farmer blocked from admin analytics (403)", anFarmer.status === 403);

  console.log(`\n==== PHASE 2 SUMMARY: ${passed} passed, ${failed} failed ====`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Suite error:", e);
  process.exit(1);
});
