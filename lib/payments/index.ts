import type { Store } from "../types";
import { ManualProvider } from "./manual";
import { RazorpayProvider } from "./razorpay";
import type { PaymentProvider } from "./types";

export * from "./types";
export { ManualProvider, manualWebhookSecret, hmacSha256Hex, MANUAL_DEV_SECRET } from "./manual";
export { RazorpayProvider, razorpayPublicKeyId } from "./razorpay";

// The live provider is chosen by platform config (Admin → Settings). The
// manual provider is the default and always works; the Razorpay provider is
// returned when selected so its configuration errors surface honestly
// instead of silently falling back.
export function getProvider(store: Store): PaymentProvider {
  if (store.config.paymentProvider === "razorpay") return new RazorpayProvider();
  return new ManualProvider();
}

export function getProviderById(id: string): PaymentProvider {
  return id === "razorpay" ? new RazorpayProvider() : new ManualProvider();
}
