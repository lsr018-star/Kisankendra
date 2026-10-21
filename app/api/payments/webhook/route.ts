import { loadStore, saveStore } from "@/lib/db";
import { fail, json } from "@/lib/api-helpers";
import { getProviderById } from "@/lib/payments";
import { applyWebhookEvent } from "@/lib/payments/service";

// Provider webhook receiver. No session auth — authenticity comes from the
// provider signature over the RAW body:
//   razorpay → `x-razorpay-signature` header, HMAC-SHA256 with the webhook secret
//   manual   → `x-kk-signature` header, HMAC-SHA256 with MANUAL_WEBHOOK_SECRET
// Bad signatures are rejected with 400 and nothing is written.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const providerId = url.searchParams.get("provider") ?? "manual";
  const rawBody = await req.text();
  const provider = getProviderById(providerId);
  const signature =
    req.headers.get("x-razorpay-signature") ?? req.headers.get("x-kk-signature");
  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    return fail("Invalid webhook signature", 400);
  }
  const event = provider.parseWebhook(rawBody);
  if (!event || !event.type) return fail("Unparseable webhook payload", 400);
  const store = loadStore();
  const result = applyWebhookEvent(store, provider.id, event);
  saveStore();
  return json({ ok: true, ...result });
}
