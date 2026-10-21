import crypto from "crypto";
import { ProviderNotConfiguredError, type PaymentProvider, type WebhookEvent } from "./types";

// Razorpay provider — a complete integration path against Razorpay's public
// API contract (https://razorpay.com/docs/api):
//   * Orders:      POST https://api.razorpay.com/v1/orders (Basic auth with
//                  RAZORPAY_KEY_ID : RAZORPAY_KEY_SECRET)
//   * Checkout:    the client hands the returned order id to Razorpay
//                  Checkout with the public key id (see /api/payments/create)
//   * Webhooks:    HMAC-SHA256 of the raw body with RAZORPAY_WEBHOOK_SECRET,
//                  sent in the `x-razorpay-signature` header; events used:
//                  payment.captured, payment.failed, refund.processed
//   * Refunds:     POST /v1/payments/{payment_id}/refund
//
// The code is complete and live-fireable: without the env keys the provider
// reports isConfigured() = false and order creation raises
// ProviderNotConfiguredError (the API surfaces that as an honest 503 —
// never a fake success). Going live = owner creates the gateway account,
// completes KYC, and sets the three env vars (README has the checklist).

const API_BASE = "https://api.razorpay.com/v1";

function keyId(): string | undefined {
  return process.env.RAZORPAY_KEY_ID || undefined;
}
function keySecret(): string | undefined {
  return process.env.RAZORPAY_KEY_SECRET || undefined;
}
function webhookSecret(): string | undefined {
  return process.env.RAZORPAY_WEBHOOK_SECRET || undefined;
}

export function razorpayPublicKeyId(): string | undefined {
  return keyId();
}

export class RazorpayProvider implements PaymentProvider {
  id = "razorpay" as const;

  isConfigured(): boolean {
    return Boolean(keyId() && keySecret());
  }

  private authHeader(): string {
    return "Basic " + Buffer.from(`${keyId()}:${keySecret()}`).toString("base64");
  }

  async createOrder(input: { amountPaise: number; currency: "INR"; receipt: string; notes?: Record<string, string> }) {
    if (!this.isConfigured()) throw new ProviderNotConfiguredError("Razorpay");
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: this.authHeader() },
      body: JSON.stringify({
        amount: input.amountPaise,
        currency: input.currency,
        receipt: input.receipt,
        notes: input.notes ?? {},
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Razorpay order creation failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as { id: string; amount: number; currency: string; status: string };
    return {
      providerOrderId: data.id,
      amountPaise: data.amount,
      currency: "INR" as const,
      status: data.status,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    const secret = webhookSecret();
    if (!secret || !signature) return false;
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  parseWebhook(rawBody: string): WebhookEvent | null {
    try {
      const data = JSON.parse(rawBody) as {
        event?: string;
        payload?: {
          payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string } };
          refund?: { entity?: { id?: string; payment_id?: string; amount?: number; status?: string } };
        };
      };
      const payment = data.payload?.payment?.entity;
      const refund = data.payload?.refund?.entity;
      return {
        type: String(data.event ?? ""),
        providerOrderId: payment?.order_id,
        providerPaymentId: payment?.id ?? refund?.payment_id,
        providerRefundId: refund?.id,
        amountPaise: payment?.amount ?? refund?.amount,
        status: payment?.status ?? refund?.status,
      };
    } catch {
      return null;
    }
  }

  async initiateRefund(input: { providerPaymentId?: string; amountPaise: number; reason: string }) {
    if (!this.isConfigured()) throw new ProviderNotConfiguredError("Razorpay");
    if (!input.providerPaymentId) throw new Error("A gateway payment id is required to refund a gateway payment");
    const res = await fetch(`${API_BASE}/payments/${input.providerPaymentId}/refund`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: this.authHeader() },
      body: JSON.stringify({ amount: input.amountPaise, notes: { reason: input.reason } }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Razorpay refund failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as { id: string; status: string };
    return { providerRefundId: data.id, status: data.status === "processed" ? "Processed" : "Initiated" };
  }
}
