#!/usr/bin/env node
/**
 * Kisankendra Phase 1 API verification.
 * Run against a running server:  BASE_URL=http://localhost:3200 node scripts/test-api.mjs
 * Exercises: auth, catalogue, checkout + assignment + financial breakdown,
 * tenant isolation, staff cost redaction, order status flow + stock movement,
 * unserved/unassigned paths, tickets and pending-shop state.
 */
const BASE = process.env.BASE_URL || "http://localhost:3200";

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`FAIL  ${name}${detail ? " — " + detail : ""}`);
  }
}

async function call(method, path, { cookie, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

async function login(identifier, password) {
  const r = await call("POST", "/api/auth/login", { body: { identifier, password } });
  if (r.status !== 200) throw new Error(`login ${identifier} failed: ${r.status} ${JSON.stringify(r.data)}`);
  const setCookie = r.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  return { cookie, user: r.data.user };
}

async function main() {
  console.log(`Testing Kisankendra at ${BASE}\n`);

  // ---------- Auth ----------
  const farmer = await login("9876543210", "farmer123");
  check("farmer login by mobile works", farmer.user.role === "farmer");
  const badLogin = await call("POST", "/api/auth/login", { body: { identifier: "9876543210", password: "wrong" } });
  check("wrong password rejected with 401", badLogin.status === 401);
  const anon = await call("GET", "/api/orders");
  check("anonymous order list rejected with 401", anon.status === 401);

  // ---------- Catalogue ----------
  const cat = await call("GET", "/api/products");
  check("catalogue returns products", cat.status === 200 && cat.data.products.length >= 10, `got ${cat.data.products?.length}`);
  const prod7 = cat.data.products.find((p) => p.id === "prod_7");
  check("prod_7 listed with availability from Shop B only (20)", prod7 && prod7.available === 20, `available=${prod7?.available}`);

  // ---------- Checkout + assignment + financial breakdown ----------
  const orderRes = await call("POST", "/api/orders", {
    cookie: farmer.cookie,
    body: {
      items: [{ productId: "prod_7", packSize: "400 ml", qty: 1 }],
      customerName: "Ramesh Patel",
      mobile: "9876543210",
      village: "Seoni Malwa",
      addressLine: "Ward 5, Near Bus Stand, Seoni Malwa",
      deliveryType: "home",
      paymentMethod: "COD",
    },
  });
  check("checkout creates order (201)", orderRes.status === 201, JSON.stringify(orderRes.data));
  const order = orderRes.data.order;
  check("order assigned to Shop B (only shop with stock)", order.shopId === "shop_b", `shopId=${order.shopId}`);
  check("order status is Pending after assignment", order.status === "Pending");
  check("items total = 54900 paise", order.itemsTotalPaise === 54900, `got ${order.itemsTotalPaise}`);
  check("delivery fee = 4900 paise (config)", order.deliveryFeePaise === 4900, `got ${order.deliveryFeePaise}`);
  check("tax = 2745 paise (5% of items)", order.taxPaise === 2745, `got ${order.taxPaise}`);
  check("grand total = 62545 paise", order.totalPaise === 62545, `got ${order.totalPaise}`);
  check("supply total from Shop B cost = 48312 paise", order.supplyTotalPaise === 48312, `got ${order.supplyTotalPaise}`);
  check("commission = 4392 paise (8% of items)", order.commissionPaise === 4392, `got ${order.commissionPaise}`);
  check("item carries Shop B cost price", order.items[0].costPaise === 48312);

  // Stock reserved at Shop B after placement
  const shopB = await login("shopb@kisankendra.in", "shop123");
  const invB1 = await call("GET", "/api/shop/inventory", { cookie: shopB.cookie });
  const invBProd7 = invB1.data.inventory.find((i) => i.productId === "prod_7");
  check("Shop B prod_7 reserved = 1 after order", invBProd7.reserved === 1, `reserved=${invBProd7.reserved}`);
  check("Shop B prod_7 stock still 20 before delivery", invBProd7.stock === 20, `stock=${invBProd7.stock}`);

  // ---------- Tenant isolation ----------
  const shopA = await login("shopa@kisankendra.in", "shop123");
  const custB = await call("GET", "/api/shop/customers", { cookie: shopB.cookie });
  const bCustomerId = custB.data.customers[0].id;
  check("Shop B can list its own customers", custB.status === 200 && custB.data.customers.length >= 5);
  const crossCust = await call("GET", `/api/shop/customers/${bCustomerId}`, { cookie: shopA.cookie });
  check("Shop A fetching Shop B customer -> 404 (isolation)", crossCust.status === 404, `got ${crossCust.status}`);
  const custA = await call("GET", "/api/shop/customers", { cookie: shopA.cookie });
  check(
    "Shop A customer list contains only Shop A customers",
    custA.data.customers.every((c) => c.shopId === "shop_a") && custA.data.customers.length >= 6
  );
  const ordersA = await call("GET", "/api/orders", { cookie: shopA.cookie });
  check(
    "Shop A order list contains none of Shop B's orders",
    ordersA.data.orders.every((o) => o.shopId === "shop_a") && !ordersA.data.orders.some((o) => o.id === order.id)
  );
  const crossOrder = await call("GET", `/api/orders/${order.id}`, { cookie: shopA.cookie });
  check("Shop A fetching Shop B order detail -> 404 (isolation)", crossOrder.status === 404, `got ${crossOrder.status}`);
  const invA = await call("GET", "/api/shop/inventory", { cookie: shopA.cookie });
  check(
    "Shop A inventory contains only Shop A rows and includes cost for owner",
    invA.data.inventory.every((i) => typeof i.costPaise === "number") && invA.data.inventory.length >= 10
  );

  // ---------- Staff boundaries ----------
  const staff = await login("staffa@kisankendra.in", "staff123");
  check("staff login works", staff.user.role === "shop_staff");
  const invStaff = await call("GET", "/api/shop/inventory", { cookie: staff.cookie });
  check(
    "staff inventory has NO cost prices (redacted)",
    invStaff.status === 200 && invStaff.data.inventory.every((i) => !("costPaise" in i))
  );
  const ordersStaff = await call("GET", "/api/orders", { cookie: staff.cookie });
  check(
    "staff order view has NO cost/margin fields",
    ordersStaff.data.orders.every(
      (o) => o.supplyTotalPaise === undefined && o.items.every((i) => !("costPaise" in i))
    )
  );
  const staffAdjust = await call("POST", "/api/shop/inventory", {
    cookie: staff.cookie,
    body: { inventoryId: invA.data.inventory[0].id, delta: 1, reason: "staff should not adjust" },
  });
  check("staff cannot adjust stock (403, no inventory permission)", staffAdjust.status === 403, `got ${staffAdjust.status}`);

  // ---------- Order status flow: accept -> ... -> delivered, stock decrements ----------
  const flow = [
    { action: "accept" },
    { action: "status", status: "Processing" },
    { action: "status", status: "Ready for Dispatch" },
    { action: "status", status: "Out for Delivery" },
    { action: "status", status: "Delivered" },
  ];
  let lastStatus = "";
  for (const step of flow) {
    const r = await call("PATCH", `/api/orders/${order.id}`, { cookie: shopB.cookie, body: step });
    lastStatus = r.data.order?.status ?? `HTTP ${r.status}`;
    if (r.status !== 200) break;
  }
  check("Shop B walks order to Delivered", lastStatus === "Delivered", `ended at ${lastStatus}`);
  const invB2 = await call("GET", "/api/shop/inventory", { cookie: shopB.cookie });
  const invBProd7After = invB2.data.inventory.find((i) => i.productId === "prod_7");
  check("Shop B prod_7 stock decreased to 19 after delivery", invBProd7After.stock === 19, `stock=${invBProd7After.stock}`);
  check("Shop B prod_7 reservation released (0)", invBProd7After.reserved === 0, `reserved=${invBProd7After.reserved}`);

  const track = await call("GET", `/api/orders/${order.id}`, { cookie: farmer.cookie });
  check(
    "farmer tracking shows full status history",
    track.status === 200 && track.data.history.length >= 6,
    `history=${track.data.history?.length}`
  );
  check("tracking exposes seller shop disclosure", track.data.shop?.name === "Verma Agro Centre");

  // Illegal transition is refused
  const badFlow = await call("PATCH", `/api/orders/${order.id}`, {
    cookie: shopB.cookie,
    body: { action: "status", status: "Processing" },
  });
  check("illegal status jump Delivered->Processing refused (422)", badFlow.status === 422, `got ${badFlow.status}`);

  // ---------- Unserved + unassigned paths ----------
  const unserved = await call("POST", "/api/orders", {
    cookie: farmer.cookie,
    body: {
      items: [{ productId: "prod_1", packSize: "500 ml", qty: 1 }],
      customerName: "Ramesh Patel",
      mobile: "9876543210",
      village: "Other Village",
      addressLine: "Somewhere",
      deliveryType: "home",
      paymentMethod: "COD",
    },
  });
  check("unserved village rejected at checkout (422)", unserved.status === 422, `got ${unserved.status}`);

  const unassigned = await call("POST", "/api/orders", {
    cookie: farmer.cookie,
    body: {
      items: [{ productId: "prod_12", packSize: "5 kg", qty: 1 }], // stocked only by Shop A
      customerName: "Ramesh Patel",
      mobile: "9876543210",
      village: "Dolriya Kalan", // served only by Shop B, which has no prod_12
      addressLine: "Main road, Dolriya Kalan",
      deliveryType: "home",
      paymentMethod: "COD",
    },
  });
  check(
    "served village but no shop with stock -> order Unassigned with reason",
    unassigned.status === 201 &&
      unassigned.data.order.status === "Unassigned" &&
      typeof unassigned.data.order.unassignedReason === "string" &&
      unassigned.data.order.unassignedReason.length > 10,
    JSON.stringify(unassigned.data).slice(0, 200)
  );

  // Admin cannot assign it to an ineligible shop (B lacks stock)
  const admin = await login("admin@kisankendra.in", "admin123");
  const badAssign = await call("PATCH", `/api/orders/${unassigned.data.order.id}`, {
    cookie: admin.cookie,
    body: { action: "assign", shopId: "shop_b" },
  });
  check("admin manual assign to ineligible shop refused (422)", badAssign.status === 422, `got ${badAssign.status}`);
  const dash = await call("GET", "/api/admin/dashboard", { cookie: admin.cookie });
  check("admin dashboard counts load", dash.status === 200 && dash.data.counts.shops === 3 && dash.data.counts.unassignedOrders >= 1);

  // Farmer cancels the unassigned order
  const cancel = await call("PATCH", `/api/orders/${unassigned.data.order.id}`, {
    cookie: farmer.cookie,
    body: { action: "cancel" },
  });
  check("farmer can cancel an unassigned order", cancel.status === 200 && cancel.data.order.status === "Cancelled");

  // ---------- Solution Box ticket (public) ----------
  const ticket = await call("POST", "/api/tickets", {
    body: {
      name: "Test Farmer",
      mobile: "9812345999",
      crop: "Soybean",
      stage: "Flowering",
      village: "Seoni Malwa",
      symptoms: "Yellow patches",
      description: "Leaves turning yellow in patches (automated test).",
      type: "solution",
    },
  });
  check("public Solution Box creates a ticket (201)", ticket.status === 201 && !!ticket.data.ticketNo);

  // ---------- Pending shop state ----------
  const shopC = await login("shopc@kisankendra.in", "shop123");
  const meC = await call("GET", "/api/auth/me", { cookie: shopC.cookie });
  check("Shop C (Pending) sees Pending status", meC.data.shop?.status === "Pending");

  // ---------- Disease library ----------
  const diseases = await call("GET", "/api/diseases?q=soybean");
  check("disease finder search returns soybean entries", diseases.status === 200 && diseases.data.diseases.length >= 3);

  console.log(`\n==== SUMMARY: ${passed} passed, ${failed} failed ====`);
  if (failures.length) console.log("Failed:", failures.join(" | "));
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("Test run crashed:", e.message);
  process.exit(1);
});
