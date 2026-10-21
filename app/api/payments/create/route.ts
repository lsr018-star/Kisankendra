import { loadStore, saveStore } from "@/lib/db";
import { currentUser, fail, json } from "@/lib/api-helpers";
import { getProvider, ProviderNotConfiguredError, razorpayPublicKeyId } from "@/lib/payments";
import { uid } from "@/lib/password";
import type { PaymentRecord } from "@/lib/types";

// Create a payment through the live provider adapter and return the
// checkout handoff data:
//  - manual:  providerOrderId + the platform UPI id / COD instructions —
//             the payer pays outside and the payment is confirmed by the
//             shop/admin claim flow or a signed webhook.
//  - razorpay: providerOrderId + public keyId for Razorpay Checkout.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Login required", 401);
  const body = await req.json().catch(() => null);
  const store = loadStore();

  let amountPaise = 0;
  let receipt = "";
  let orderId: string | undefined;
  let billingId: string | undefined;
  let shopId: string | undefined;

  if (body?.billingId) {
    const billing = store.billingRecords.find((b) => b.id === String(body.billingId));
    if (!billing) return fail("Billing record not found", 404);
    if (user.role !== "admin" && billing.shopId !== user.shopId) return fail("Not your billing record", 403);
    if (billing.status === "Paid") return fail("This bill is already paid", 409);
    amountPaise = billing.amountPaise;
    receipt = billing.id;
    billingId = billing.id;
    shopId = billing.shopId;
  } else if (body?.orderId) {
    const order = store.orders.find((o) => o.id === String(body.orderId));
    if (!order) return fail("Order not found", 404);
    const mine =
      user.role === "admin" ||
      (user.role === "farmer" && order.farmerId === user.id) ||
      ((user.role === "shop_owner" || user.role === "shop_staff") && order.shopId === user.shopId);
    if (!mine) return fail("Not your order", 403);
    amountPaise = order.totalPaise;
    receipt = order.orderNo;
    orderId = order.id;
    shopId = order.shopId;
  } else {
    return fail("billingId or orderId is required", 422);
  }

  const provider = getProvider(store);
  try {
    const providerOrder = await provider.createOrder({
      amountPaise,
      currency: "INR",
      receipt,
      notes: { orderId: orderId ?? "", billingId: billingId ?? "" },
    });
    const payment: PaymentRecord = {
      id: uid("pay_"),
      orderId,
      billingId,
      shopId,
      provider: provider.id,
      providerOrderId: providerOrder.providerOrderId,
      amountPaise,
      currency: "INR",
      status: "Created",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.payments.push(payment);
    saveStore();
    return json(
      {
        paymentId: payment.id,
        provider: provider.id,
        providerOrderId: providerOrder.providerOrderId,
        amountPaise,
        currency: "INR",
        keyId: provider.id === "razorpay" ? razorpayPublicKeyId() : undefined,
        upiId: provider.id === "manual" ? store.config.upiId : undefined,
        receipt,
      },
      201
    );
  } catch (e) {
    if (e instanceof ProviderNotConfiguredError) return fail(e.message, 503);
    return fail(e instanceof Error ? e.message : "Payment creation failed", 502);
  }
}
