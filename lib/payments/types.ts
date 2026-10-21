import type { PaymentProviderId } from "../types";

// Payment provider adapter contract. Every gateway-specific behaviour
// (order creation, checkout handoff data, webhook signature scheme, refund
// endpoint) lives behind this interface so switching the live gateway is a
// configuration change (env keys + config.paymentProvider), not a rewrite.
//
// ADAPTER POINT (Phase 3 go-live): implement this interface for a new
// provider, register it in lib/payments/index.ts, add its keys to
// .env.example, and set config.paymentProvider. Nothing else changes.

export interface CreatePaymentInput {
  amountPaise: number;
  currency: "INR";
  receipt: string; // our internal reference (order no / billing id)
  notes?: Record<string, string>;
}

export interface ProviderOrder {
  providerOrderId: string;
  amountPaise: number;
  currency: "INR";
  status: string;
}

export interface WebhookEvent {
  type: string; // e.g. payment.captured, payment.failed, refund.processed
  providerOrderId?: string;
  providerPaymentId?: string;
  providerRefundId?: string;
  amountPaise?: number;
  status?: string;
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`${provider} gateway is not configured. Add the provider API keys (see README "Going live with a payment gateway") and set the payment provider in Admin → Settings.`);
    this.name = "ProviderNotConfiguredError";
  }
}

export interface PaymentProvider {
  id: PaymentProviderId;
  isConfigured(): boolean;
  createOrder(input: CreatePaymentInput): Promise<ProviderOrder>;
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean;
  parseWebhook(rawBody: string): WebhookEvent | null;
  initiateRefund(input: {
    providerPaymentId?: string;
    amountPaise: number;
    reason: string;
  }): Promise<{ providerRefundId: string; status: string }>;
}
