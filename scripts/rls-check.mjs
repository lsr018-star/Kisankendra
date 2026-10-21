// RLS verification: connect as the restricted kk_runtime role and show that
// (a) without a shop context it sees no tenant rows, (b) with
// app.current_shop set it sees exactly that shop's rows, (c) with
// app.bypass_rls = 'on' (the app's own service mode) it sees all rows.
// Run: DATABASE_URL_ADMIN=postgres://postgres@localhost:54329/kisankendra_app node scripts/rls-check.mjs
import pg from "pg";

const base = process.env.DATABASE_URL_ADMIN ?? "postgres://postgres@localhost:54329/kisankendra_app";
const admin = new pg.Client({ connectionString: base });
await admin.connect();
const shopRow = await admin.query("select doc->>'shopId' as shop, count(*)::int as n from orders group by 1 order by 2 desc limit 1");
const anyShop = shopRow.rows[0].shop;
const totalOrders = await admin.query("select count(*)::int as n from orders");
console.log(`admin view: ${totalOrders.rows[0].n} orders; largest shop ${anyShop} has ${shopRow.rows[0].n}`);
await admin.end();

const url = new URL(base);
url.username = "kk_runtime";
url.password = "kk_runtime_dev_only";
const c = new pg.Client({ connectionString: url.toString() });
await c.connect();
const noCtx = await c.query("select count(*)::int as n from orders");
console.log(`kk_runtime, no shop context: ${noCtx.rows[0].n} orders visible (expect 0)`);
await c.query("select set_config('app.current_shop', $1, false)", [anyShop]);
const scoped = await c.query("select count(*)::int as n from orders");
console.log(`kk_runtime, app.current_shop=${anyShop}: ${scoped.rows[0].n} orders visible (expect ${shopRow.rows[0].n})`);
const crossCheck = await c.query("select count(*)::int as n from orders where shop_id <> $1", [anyShop]);
console.log(`kk_runtime, cross-shop rows visible: ${crossCheck.rows[0].n} (expect 0)`);
await c.query("select set_config('app.bypass_rls', 'on', false)");
const bypass = await c.query("select count(*)::int as n from orders");
console.log(`kk_runtime, bypass on (app service mode): ${bypass.rows[0].n} orders visible (expect ${totalOrders.rows[0].n})`);
await c.end();

const ok = noCtx.rows[0].n === 0 && scoped.rows[0].n === shopRow.rows[0].n && crossCheck.rows[0].n === 0 && bypass.rows[0].n === totalOrders.rows[0].n;
console.log(ok ? "RLS CHECK: PASS" : "RLS CHECK: FAIL");
process.exit(ok ? 0 : 1);
