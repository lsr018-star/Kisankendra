import { audit } from "./db";
import { uid } from "./password";
import type {
  BillingRecord,
  PaymentRecord,
  ShopSubscription,
  Store,
  SubscriptionStatus,
} from "./types";

// A subscription's stored status is the base state; the effective status is
// derived from its expiry so Grace/Expired transitions happen automatically
// with time (grace window from platform config).
export function effectiveStatus(store: Store, sub: ShopSubscription): SubscriptionStatus {
  if (sub.status === "Cancelled") return "Cancelled";
  const now = Date.now();
  const exp = new Date(sub.expiresAt).getTime();
  if (now <= exp) return "Active";
  const graceEnd = exp + store.config.subscriptionGraceDays * 86_400_000;
  if (now <= graceEnd) return "Grace";
  return "Expired";
}

export function currentSubscription(store: Store, shopId: string): (ShopSubscription & { status: SubscriptionStatus }) | null {
  const subs = store.subscriptions
    .filter((s) => s.shopId === shopId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (subs.length === 0) return null;
  const latest = subs[0];
  return { ...latest, status: effectiveStatus(store, latest) };
}

// Subscribe (or renew/switch): creates the subscription period and its
// billing record. Paid confirmation is a separate step (manual/COD/UPI
// reference, confirmed by admin) — the gateway adapter can confirm
// automatically via webhook when keys are added (lib/payments).
export function subscribe(
  store: Store,
  shopId: string,
  planId: string,
  actorId: string
): { subscription: ShopSubscription; billing: BillingRecord } | { error: string } {
  const plan = store.plans.find((p) => p.id === planId && p.active);
  if (!plan) return { error: "Plan not found or not active" };
  const now = new Date();
  const expires = new Date(now.getTime() + plan.periodDays * 86_400_000);
  const subscription: ShopSubscription = {
    id: uid("sub_"),
    shopId,
    planId: plan.id,
    status: "Active",
    startsAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
  };
  store.subscriptions.push(subscription);
  const billing: BillingRecord = {
    id: uid("bill_"),
    shopId,
    subscriptionId: subscription.id,
    planId: plan.id,
    description: `${plan.name} — ${plan.periodDays} days`,
    amountPaise: plan.pricePaise,
    method: "Manual",
    status: plan.pricePaise === 0 ? "Paid" : "Pending",
    reference: plan.pricePaise === 0 ? "Free plan" : undefined,
    createdAt: now.toISOString(),
    confirmedAt: plan.pricePaise === 0 ? now.toISOString() : undefined,
    confirmedBy: plan.pricePaise === 0 ? actorId : undefined,
  };
  if (plan.pricePaise === 0) {
    const payment: PaymentRecord = {
      id: uid("pay_"),
      billingId: billing.id,
      shopId,
      provider: "manual",
      amountPaise: 0,
      currency: "INR",
      status: "Paid",
      method: "manual",
      reference: "Free plan",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    store.payments.push(payment);
    billing.paymentId = payment.id;
  }
  store.billingRecords.unshift(billing);
  audit(store, actorId, "shop_owner", "subscription.subscribe", "subscription", subscription.id, `${plan.name} for shop ${shopId}`);
  return { subscription, billing };
}
