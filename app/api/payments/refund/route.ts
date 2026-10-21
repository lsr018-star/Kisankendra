import { loadStore, saveStore } from "@/lib/db";
import { currentUser, fail, json } from "@/lib/api-helpers";
import { initiateRefund } from "@/lib/payments/service";

// Initiate a refund for an order's completed payment. Admin can refund any
// order; a shop owner can refund their own shop's orders. The provider
// adapter performs the refund (manual = ledger entry settled by hand;
// gateway = real refund API call) and the ledger records are written by
// the payments service.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Login required", 401);
  if (user.role !== "admin" && user.role !== "shop_owner") {
    return fail("Only admin or the shop owner can initiate a refund", 403);
  }
  const body = await req.json().catch(() => null);
  const store = loadStore();
  const order = store.orders.find((o) => o.id === String(body?.orderId ?? ""));
  if (!order) return fail("Order not found", 404);
  if (user.role === "shop_owner" && order.shopId !== user.shopId) {
    return fail("Not your shop's order", 403);
  }
  const reason = String(body?.reason ?? "").trim() || "Refund requested";
  const result = await initiateRefund(store, order, reason, user.id, user.role);
  if ("error" in result) return fail(result.error, result.status);
  saveStore();
  return json({ ok: true, refund: result.refund, payment: result.payment }, 201);
}
