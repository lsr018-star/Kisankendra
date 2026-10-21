import { loadStore, saveStore, audit } from "@/lib/db";
import { fail, isResponse, json, requireRole } from "@/lib/api-helpers";
import { generateSettlement } from "@/lib/settlements";

// Settlement ledger (admin): list all settlements with shop names,
// generate a period settlement for a shop from its delivered orders, and
// mark a settlement settled once the amount has been reconciled/paid.
export async function GET() {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const store = loadStore();
  return json({
    settlements: store.settlements.map((s) => ({
      ...s,
      shopName: store.shops.find((x) => x.id === s.shopId)?.name ?? s.shopId,
      dueToShopPaise: s.supplyPaise,
    })),
    payments: store.payments.slice(0, 50),
    refunds: store.refunds.slice(0, 50),
    shops: store.shops.map((s) => ({ id: s.id, name: s.name })),
    paymentProvider: store.config.paymentProvider,
  });
}

export async function POST(req: Request) {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => null);
  const store = loadStore();

  if (body?.action === "generate") {
    const shopId = String(body?.shopId ?? "");
    const from = String(body?.from ?? "");
    const to = String(body?.to ?? "");
    if (!store.shops.some((s) => s.id === shopId)) return fail("Shop not found", 422);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return fail("from and to dates (YYYY-MM-DD) are required", 422);
    }
    const record = generateSettlement(store, shopId, from, to, user.id);
    saveStore();
    return json({ ok: true, settlement: record }, 201);
  }

  if (body?.action === "settle") {
    const record = store.settlements.find((s) => s.id === String(body?.settlementId ?? ""));
    if (!record) return fail("Settlement not found", 404);
    if (record.status === "Settled") return fail("Already settled", 409);
    record.status = "Settled";
    record.settledAt = new Date().toISOString();
    audit(store, user.id, user.role, "settlement.settle", "settlement", record.id, `Shop ${record.shopId}`);
    saveStore();
    return json({ ok: true, settlement: record });
  }

  return fail("Unknown action", 422);
}
