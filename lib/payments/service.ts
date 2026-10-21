import { audit } from "../db";
import { uid } from "../password";
import type { Order, PaymentRecord, RefundRecord, Store } from "../types";
import { getProvider } from "./index";
import type { WebhookEvent } from "./types";

// Business operations on top of the provider adapters. Routes call these;
// provider-specific wire behaviour never leaks above this layer.

// Record a completed payment for an order through the live provider (COD
// cash collected on delivery, or counter payment for a walk-in sale).
// Idempotent per order: a second call returns the existing record.
export function recordOrderPayment(
  store: Store,
  order: Order,
  method: string,
  reference: string,
  actorId: string
): PaymentRecord {
  const existing = store.payments.find(
    (p) => p.orderId === order.id && (p.status === "Paid" || p.status === "Captured")
  );
  if (existing) return existing;
  const provider = getProvider(store);
  const payment: PaymentRecord = {
    id: uid("pay_"),
    orderId: order.id,
    shopId: order.shopId,
    provider: provider.id,
    amountPaise: order.totalPaise,
    currency: "INR",
    status: "Paid",
    method,
    reference,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.payments.push(payment);
  audit(store, actorId, "system", "payment.record", "payment", payment.id, `${order.orderNo}: ${method} ${order.totalPaise} paise`);
  return payment;
}

// Initiate a refund for an order's payment through the live provider and
// write the ledger records. Full-amount refunds only in this phase.
export async function initiateRefund(
  store: Store,
  order: Order,
  reason: string,
  actorId: string,
  actorRole: string
): Promise<{ refund: RefundRecord; payment: PaymentRecord } | { error: string; status: number }> {
  const payment = store.payments.find(
    (p) => p.orderId === order.id && (p.status === "Paid" || p.status === "Captured")
  );
  if (!payment) return { error: "No completed payment found for this order", status: 404 };
  if (store.refunds.some((r) => r.paymentId === payment.id && r.status !== "Failed")) {
    return { error: "A refund is already recorded for this payment", status: 409 };
  }
  const provider = getProvider(store);
  try {
    const result = await provider.initiateRefund({
      providerPaymentId: payment.providerPaymentId,
      amountPaise: payment.amountPaise,
      reason,
    });
    const refund: RefundRecord = {
      id: uid("rf_"),
      paymentId: payment.id,
      orderId: order.id,
      provider: provider.id,
      providerRefundId: result.providerRefundId,
      amountPaise: payment.amountPaise,
      status: result.status === "Processed" ? "Processed" : "Initiated",
      reason,
      createdAt: new Date().toISOString(),
    };
    store.refunds.unshift(refund);
    payment.status = refund.status === "Processed" ? "Refunded" : payment.status;
    payment.updatedAt = new Date().toISOString();
    order.paymentStatus = refund.status === "Processed" ? "Refunded" : order.paymentStatus;
    audit(store, actorId, actorRole, "payment.refund", "payment", payment.id, `${order.orderNo}: ${reason}`);
    return { refund, payment };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Refund failed", status: 503 };
  }
}

// Apply a verified webhook event to the ledger. Matches payments by the
// provider's order/payment ids (set at /api/payments/create time) and by
// our receipt reference carried in payment notes for billing payments.
export function applyWebhookEvent(
  store: Store,
  providerId: string,
  event: WebhookEvent
): { matched: boolean; detail: string } {
  const payment = store.payments.find(
    (p) =>
      p.provider === providerId &&
      ((event.providerOrderId && p.providerOrderId === event.providerOrderId) ||
        (event.providerPaymentId && p.providerPaymentId === event.providerPaymentId))
  );

  if (event.type.includes("refund")) {
    const refund = store.refunds.find(
      (r) => r.provider === providerId && event.providerRefundId && r.providerRefundId === event.providerRefundId
    );
    if (refund && event.status === "processed") {
      refund.status = "Processed";
      const p = store.payments.find((x) => x.id === refund.paymentId);
      if (p) {
        p.status = "Refunded";
        p.updatedAt = new Date().toISOString();
      }
      if (refund.orderId) {
        const o = store.orders.find((x) => x.id === refund.orderId);
        if (o) o.paymentStatus = "Refunded";
      }
      return { matched: true, detail: `Refund ${refund.id} processed` };
    }
    return { matched: Boolean(refund), detail: refund ? "Refund event noted" : "Refund not found" };
  }

  if (!payment) return { matched: false, detail: "No payment matched the event" };

  if (event.providerPaymentId) payment.providerPaymentId = event.providerPaymentId;
  if (event.type === "payment.captured" || event.status === "captured" || event.status === "paid") {
    payment.status = "Paid";
    payment.updatedAt = new Date().toISOString();
    if (payment.billingId) {
      const billing = store.billingRecords.find((b) => b.id === payment.billingId);
      if (billing && billing.status !== "Paid") {
        billing.status = "Paid";
        billing.method = "Gateway";
        billing.confirmedAt = new Date().toISOString();
        billing.confirmedBy = "webhook";
      }
    }
    if (payment.orderId) {
      const order = store.orders.find((o) => o.id === payment.orderId);
      if (order && order.paymentStatus !== "Paid") order.paymentStatus = "Paid";
    }
    audit(store, "webhook", providerId, "payment.captured", "payment", payment.id, event.type);
    return { matched: true, detail: `Payment ${payment.id} marked Paid` };
  }
  if (event.type === "payment.failed" || event.status === "failed") {
    payment.status = "Failed";
    payment.updatedAt = new Date().toISOString();
    return { matched: true, detail: `Payment ${payment.id} marked Failed` };
  }
  return { matched: true, detail: `Event ${event.type} noted for payment ${payment.id}` };
}
