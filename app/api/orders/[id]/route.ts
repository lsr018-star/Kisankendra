import { loadStore, saveStore, audit } from "@/lib/db";
import { pgEnabled, flushPgWrites, fetchOrderByIdFromPg } from "@/lib/pg";
import { currentUser, fail, json } from "@/lib/api-helpers";
import { hasPermission } from "@/lib/auth";
import {
  applyDelivery,
  applyReturn,
  assignOrder,
  recordHistory,
  releaseReservation,
} from "@/lib/assignment";
import { canViewOrder, serializeOrder } from "@/lib/orders";
import { recordOrderPayment } from "@/lib/payments/service";
import type { Order } from "@/lib/types";

const FLOW: Record<string, string[]> = {
  Pending: ["Accepted", "Cancelled"],
  Accepted: ["Processing", "Cancelled"],
  Processing: ["Ready for Dispatch", "Cancelled"],
  "Ready for Dispatch": ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered"],
  Delivered: ["Returned"],
  Cancelled: [],
  Returned: [],
  Unassigned: ["Cancelled"],
};

async function loadOrderForUser(id: string) {
  const user = await currentUser();
  if (!user) return { error: fail("Login required", 401) };
  const store = loadStore();
  let order = store.orders.find((o) => o.id === id);
  if (!order && pgEnabled()) {
    // Instance booted before this order existed: fetch and adopt it from
    // Postgres instead of wrongly answering 404 (also covers shop status
    // actions on orders placed after the instance booted).
    const fromPg = await fetchOrderByIdFromPg(id).catch(() => null);
    if (fromPg) {
      store.orders.push(fromPg);
      order = fromPg;
    }
  }
  if (!order) return { error: fail("Order not found", 404) };
  // Admin may also view unassigned orders.
  if (!canViewOrder(order, user) && !(user.role === "admin")) {
    return { error: fail("Order not found", 404) };
  }
  return { user, store, order };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await loadOrderForUser(id);
  if ("error" in r) return r.error;
  const { store, order, user } = r;
  const history = store.statusHistory
    .filter((h) => h.orderId === order.id)
    .sort((a, b) => a.at.localeCompare(b.at));
  const shop = order.shopId ? store.shops.find((s) => s.id === order.shopId) : undefined;
  return json({
    order: serializeOrder(order, user),
    history,
    shop: shop ? { name: shop.name, address: shop.address, mobile: shop.mobile } : null,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await loadOrderForUser(id);
  if ("error" in r) return r.error;
  const { user, store, order } = r;
  const body = await req.json().catch(() => null);
  const action = String(body?.action ?? "");

  // ---- Farmer: cancel own order ----
  if (action === "cancel") {
    if (user.role !== "farmer" || order.farmerId !== user.id) return fail("Only the customer can cancel this order", 403);
    if (!["Pending", "Accepted", "Processing", "Ready for Dispatch", "Unassigned"].includes(order.status)) {
      return fail(`Order in status ${order.status} cannot be cancelled`, 422);
    }
    releaseReservation(store, order);
    order.status = "Cancelled";
    order.paymentStatus = order.paymentStatus === "Paid" ? "Refunded" : "Pending";
    recordHistory(store, order, "Cancelled", user.id, "farmer", String(body?.reason ?? "Cancelled by customer"));
    audit(store, user.id, "farmer", "order.cancel", "order", order.id, `Order ${order.orderNo} cancelled`);
    saveStore();
    if (pgEnabled()) await flushPgWrites();
    return json({ order: serializeOrder(order, user) });
  }

  // ---- Admin: manual assignment ----
  if (action === "assign") {
    if (user.role !== "admin") return fail("Admin only", 403);
    const shopId = String(body?.shopId ?? "");
    if (order.status !== "Unassigned") return fail("Only unassigned orders can be manually assigned", 422);
    const shop = assignOrder(store, order, [], shopId);
    if (!shop || shop.id !== shopId) {
      return fail("Chosen shop is not eligible (must be approved, licence verified, serve the village and hold full stock)", 422);
    }
    recordHistory(store, order, "Pending", user.id, "admin", `Manually assigned to ${shop.name}`);
    audit(store, user.id, "admin", "order.assign", "order", order.id, `Manual assignment to ${shop.name}`);
    saveStore();
    if (pgEnabled()) await flushPgWrites();
    return json({ order: serializeOrder(order, user) });
  }

  // ---- Shop actions: accept / reject / status ----
  const isShopUser = user.role === "shop_owner" || user.role === "shop_staff";
  if (!isShopUser) return fail("Not allowed", 403);
  if (order.shopId !== user.shopId) return fail("This order belongs to another shop", 403);
  if (!hasPermission(user, "orders")) return fail("Your account does not have the orders permission", 403);

  if (action === "accept") {
    if (order.status !== "Pending") return fail("Only a pending order can be accepted", 422);
    order.status = "Accepted";
    const asg = [...store.assignments].reverse().find((a) => a.orderId === order.id && a.shopId === user.shopId);
    if (asg) asg.status = "Accepted";
    recordHistory(store, order, "Accepted", user.id, user.role, "Shop accepted the order");
    audit(store, user.id, user.role, "order.accept", "order", order.id, order.orderNo);
    saveStore();
    if (pgEnabled()) await flushPgWrites();
    return json({ order: serializeOrder(order, user) });
  }

  if (action === "reject") {
    if (!["Pending", "Accepted"].includes(order.status)) return fail("This order can no longer be rejected", 422);
    const shopId = user.shopId!;
    releaseReservation(store, order);
    const asg = [...store.assignments].reverse().find((a) => a.orderId === order.id && a.shopId === shopId);
    if (asg) asg.status = "Rejected";
    recordHistory(store, order, "Rejected", user.id, user.role, String(body?.reason ?? "Shop cannot fulfil"));
    const rejectedBefore = store.assignments
      .filter((a) => a.orderId === order.id && a.status === "Rejected")
      .map((a) => a.shopId);
    order.shopId = undefined;
    order.customerId = undefined;
    const next = assignOrder(store, order, rejectedBefore);
    if (next) {
      recordHistory(store, order, "Pending", "system", "system", `Reassigned to ${next.name} after rejection`);
    } else {
      order.status = "Unassigned";
      order.unassignedReason =
        "No partner shop can fulfil this order right now. You can wait for assignment, choose alternatives, or cancel.";
      recordHistory(store, order, "Unassigned", "system", "system", "No other eligible shop after rejection");
    }
    audit(store, user.id, user.role, "order.reject", "order", order.id, order.orderNo);
    saveStore();
    if (pgEnabled()) await flushPgWrites();
    return json({ order: serializeOrder(order, user) });
  }

  if (action === "status") {
    const nextStatus = String(body?.status ?? "");
    const allowed = FLOW[order.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      return fail(`Cannot move from ${order.status} to ${nextStatus}`, 422);
    }
    if (nextStatus === "Delivered") {
      applyDelivery(store, order);
      if (order.paymentStatus === "Pending") {
        order.paymentStatus = "Paid";
        // COD/manual money changes hands at delivery — write the ledger
        // record through the payments layer (idempotent per order).
        recordOrderPayment(
          store,
          order,
          order.paymentMethod === "COD" ? "cod" : "manual",
          order.paymentMethod === "COD" ? "Cash collected on delivery" : "Payment confirmed on delivery",
          user.id
        );
      }
    }
    if (nextStatus === "Cancelled") releaseReservation(store, order);
    if (nextStatus === "Returned") {
      applyReturn(store, order);
      if (order.paymentStatus === "Paid") order.paymentStatus = "Refunded";
    }
    order.status = nextStatus as Order["status"];
    recordHistory(store, order, nextStatus, user.id, user.role, body?.note ? String(body.note) : undefined);
    audit(store, user.id, user.role, "order.status", "order", order.id, `${order.orderNo} -> ${nextStatus}`);
    saveStore();
    if (pgEnabled()) await flushPgWrites();
    return json({ order: serializeOrder(order, user) });
  }

  return fail("Unknown action", 422);
}
