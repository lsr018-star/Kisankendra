import { loadStore, saveStore, audit } from "@/lib/db";
import { fail, isResponse, json, requireRole } from "@/lib/api-helpers";
import { currentSubscription, subscribe } from "@/lib/subscriptions";
import { uid } from "@/lib/password";
import type { SubscriptionPlan } from "@/lib/types";

// Admin plan management: catalogue CRUD, assigning plans to shops, and
// confirming claimed subscription payments (manual/COD flow — the gateway
// webhook performs the same confirmation automatically when configured).
export async function GET() {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const store = loadStore();
  const subscriptions = store.subscriptions
    .map((s) => ({
      ...s,
      status: currentSubscription(store, s.shopId)?.id === s.id ? currentSubscription(store, s.shopId)!.status : s.status,
      shopName: store.shops.find((x) => x.id === s.shopId)?.name ?? s.shopId,
      planName: store.plans.find((p) => p.id === s.planId)?.name ?? s.planId,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return json({
    plans: store.plans,
    subscriptions,
    billing: store.billingRecords.map((b) => ({
      ...b,
      shopName: store.shops.find((x) => x.id === b.shopId)?.name ?? b.shopId,
    })),
    shops: store.shops.map((s) => ({ id: s.id, name: s.name, status: s.status })),
  });
}

export async function POST(req: Request) {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => null);
  const action = String(body?.action ?? "");
  const store = loadStore();

  if (action === "createPlan" || action === "updatePlan") {
    const name = String(body?.name ?? "").trim();
    const pricePaise = Number(body?.pricePaise ?? -1);
    const periodDays = Number(body?.periodDays ?? 0);
    if (!name || !Number.isFinite(pricePaise) || pricePaise < 0 || periodDays <= 0) {
      return fail("Plan name, a non-negative price and a positive period are required", 422);
    }
    const features = Array.isArray(body?.features) ? body.features.map(String) : [];
    const featuresHi = Array.isArray(body?.featuresHi) ? body.featuresHi.map(String) : features;
    if (action === "createPlan") {
      const plan: SubscriptionPlan = {
        id: uid("plan_"),
        name,
        nameHi: String(body?.nameHi ?? name),
        pricePaise,
        periodDays,
        features,
        featuresHi,
        active: true,
        createdAt: new Date().toISOString(),
      };
      store.plans.push(plan);
      audit(store, user.id, user.role, "plan.create", "plan", plan.id, name);
      saveStore();
      return json({ ok: true, plan }, 201);
    }
    const plan = store.plans.find((p) => p.id === String(body?.planId ?? ""));
    if (!plan) return fail("Plan not found", 404);
    plan.name = name;
    plan.nameHi = String(body?.nameHi ?? plan.nameHi);
    plan.pricePaise = pricePaise;
    plan.periodDays = periodDays;
    plan.features = features;
    plan.featuresHi = featuresHi;
    if (typeof body?.active === "boolean") plan.active = body.active;
    audit(store, user.id, user.role, "plan.update", "plan", plan.id, name);
    saveStore();
    return json({ ok: true, plan });
  }

  if (action === "togglePlan") {
    const plan = store.plans.find((p) => p.id === String(body?.planId ?? ""));
    if (!plan) return fail("Plan not found", 404);
    plan.active = !plan.active;
    audit(store, user.id, user.role, "plan.toggle", "plan", plan.id, `active=${plan.active}`);
    saveStore();
    return json({ ok: true, plan });
  }

  if (action === "assignPlan") {
    const shopId = String(body?.shopId ?? "");
    if (!store.shops.some((s) => s.id === shopId)) return fail("Shop not found", 422);
    const result = subscribe(store, shopId, String(body?.planId ?? ""), user.id);
    if ("error" in result) return fail(result.error, 422);
    saveStore();
    return json({ ok: true, ...result }, 201);
  }

  if (action === "confirmBilling") {
    const billing = store.billingRecords.find((b) => b.id === String(body?.billingId ?? ""));
    if (!billing) return fail("Billing record not found", 404);
    if (billing.status === "Paid") return fail("Already paid", 409);
    billing.status = "Paid";
    billing.confirmedAt = new Date().toISOString();
    billing.confirmedBy = user.id;
    const payment = billing.paymentId
      ? store.payments.find((p) => p.id === billing.paymentId)
      : undefined;
    if (payment) {
      payment.status = "Paid";
      payment.updatedAt = new Date().toISOString();
    } else {
      store.payments.push({
        id: uid("pay_"),
        billingId: billing.id,
        shopId: billing.shopId,
        provider: store.config.paymentProvider,
        amountPaise: billing.amountPaise,
        currency: "INR",
        status: "Paid",
        method: billing.method === "UPI" ? "upi" : billing.method === "COD" ? "cod" : "manual",
        reference: billing.reference,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      billing.paymentId = store.payments[store.payments.length - 1].id;
    }
    audit(store, user.id, user.role, "billing.confirm", "billing", billing.id, `${billing.amountPaise} paise confirmed`);
    saveStore();
    return json({ ok: true, billing });
  }

  if (action === "cancelSubscription") {
    const sub = store.subscriptions.find((s) => s.id === String(body?.subscriptionId ?? ""));
    if (!sub) return fail("Subscription not found", 404);
    sub.status = "Cancelled";
    audit(store, user.id, user.role, "subscription.cancel", "subscription", sub.id, `shop ${sub.shopId}`);
    saveStore();
    return json({ ok: true, subscription: sub });
  }

  return fail("Unknown action", 422);
}
