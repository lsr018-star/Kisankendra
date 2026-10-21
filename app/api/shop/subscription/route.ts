import { loadStore, saveStore, audit } from "@/lib/db";
import { fail, isResponse, json, requireShopUser } from "@/lib/api-helpers";
import { currentSubscription, subscribe } from "@/lib/subscriptions";
import { uid } from "@/lib/password";

// Shop-facing subscription API: plan catalogue, current plan (with the
// time-derived Active/Grace/Expired status), billing history, subscribe,
// and recording a payment claim (UPI reference or COD note) that an admin
// then confirms. Gateway confirmation arrives via webhook (lib/payments).
export async function GET() {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  const store = loadStore();
  const shopId = user.shopId!;
  return json({
    plans: store.plans.filter((p) => p.active),
    current: currentSubscription(store, shopId),
    subscriptions: store.subscriptions
      .filter((s) => s.shopId === shopId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    billing: store.billingRecords.filter((b) => b.shopId === shopId),
    paymentProvider: store.config.paymentProvider,
    upiId: store.config.upiId,
  });
}

export async function POST(req: Request) {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  if (user.role !== "shop_owner") return fail("Only the shop owner can manage the subscription", 403);
  const body = await req.json().catch(() => null);
  const store = loadStore();
  const shopId = user.shopId!;

  if (body?.action === "payBilling") {
    const billing = store.billingRecords.find((b) => b.id === String(body?.billingId ?? ""));
    if (!billing || billing.shopId !== shopId) return fail("Billing record not found", 404);
    if (billing.status === "Paid") return fail("This bill is already paid", 409);
    const reference = String(body?.reference ?? "").trim();
    if (!reference) return fail("A UPI reference / transaction ID or payment note is required", 422);
    billing.method = body?.method === "UPI" ? "UPI" : body?.method === "COD" ? "COD" : "Manual";
    billing.reference = reference;
    billing.status = "Confirmed"; // claimed by shop; admin verifies -> Paid
    const payment = {
      id: uid("pay_"),
      billingId: billing.id,
      shopId,
      provider: store.config.paymentProvider,
      amountPaise: billing.amountPaise,
      currency: "INR" as const,
      status: "Authorized" as const,
      method: billing.method === "UPI" ? "upi" : billing.method === "COD" ? "cod" : "manual",
      reference,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.payments.push(payment);
    billing.paymentId = payment.id;
    audit(store, user.id, user.role, "billing.claim", "billing", billing.id, `${billing.method} reference ${reference}`);
    saveStore();
    return json({ ok: true, billing });
  }

  const planId = String(body?.planId ?? "");
  if (!planId) return fail("planId is required", 422);
  const result = subscribe(store, shopId, planId, user.id);
  if ("error" in result) return fail(result.error, 422);
  saveStore();
  return json({ ok: true, ...result }, 201);
}
