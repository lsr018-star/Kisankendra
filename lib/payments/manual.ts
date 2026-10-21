import crypto from "crypto";
import { uid } from "../password";
import type { PaymentProvider, WebhookEvent } from "./types";

// Manual / UPI-reference provider — the default live provider. It records
// payments that happen outside a gateway: cash on delivery, cash at the
// shop counter, or a UPI transfer the payer identifies by its transaction
// reference. "Orders" are local references; refunds are recorded as
// initiated and settled by hand (cash/UPI reversal by the shop).
//
// Its webhook accepts the same signed-event shape a gateway sends, signed
// with HMAC-SHA256 over the raw body using MANUAL_WEBHOOK_SECRET (a
// development default is used when the env var is unset — set a real one
// before exposing the endpoint publicly). This lets integrations and the
// automated tests exercise the exact production webhook path.
export const MANUAL_DEV_SECRET = "kk-manual-dev-secret-change-in-production";

export function manualWebhookSecret(): string {
  return process.env.MANUAL_WEBHOOK_SECRET ?? MANUAL_DEV_SECRET;
}

export function hmacSha256Hex(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export class ManualProvider implements PaymentProvider {
  id = "manual" as const;

  isConfigured(): boolean {
    return true;
  }

  async createOrder(input: { amountPaise: number; currency: "INR"; receipt: string }) {
    return {
      providerOrderId: uid("manual_ord_"),
      amountPaise: input.amountPaise,
      currency: "INR" as const,
      status: "created",
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    const expected = hmacSha256Hex(manualWebhookSecret(), rawBody);
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  parseWebhook(rawBody: string): WebhookEvent | null {
    try {
      const data = JSON.parse(rawBody) as Record<string, unknown>;
      return {
        type: String(data.event ?? data.type ?? ""),
        providerOrderId: typeof data.providerOrderId === "string" ? data.providerOrderId : undefined,
        providerPaymentId: typeof data.providerPaymentId === "string" ? data.providerPaymentId : undefined,
        providerRefundId: typeof data.providerRefundId === "string" ? data.providerRefundId : undefined,
        amountPaise: typeof data.amountPaise === "number" ? data.amountPaise : undefined,
        status: typeof data.status === "string" ? data.status : undefined,
      };
    } catch {
      return null;
    }
  }

  async initiateRefund(input: { amountPaise: number; reason: string }) {
    // Manual settlement: the refund is performed by the shop in cash or by
    // a UPI reversal; the record is the ledger entry for it.
    return { providerRefundId: uid("manual_rf_"), status: "Initiated" };
  }
}
