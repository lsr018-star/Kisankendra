import { loadStore, saveStore, nextSeq, audit } from "@/lib/db";
import { fail, isResponse, json, requireShopUser } from "@/lib/api-helpers";
import { hasPermission } from "@/lib/auth";
import { pctOf } from "@/lib/money";
import { availableAcross, findBatches, findInventory, recordHistory } from "@/lib/assignment";
import { recordOrderPayment } from "@/lib/payments/service";
import { serializeOrder } from "@/lib/orders";
import { uid } from "@/lib/password";
import type { Order, OrderItem } from "@/lib/types";

// Walk-in (offline) order recorded by the shop for its own customer.
export async function POST(req: Request) {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  if (!hasPermission(user, "orders")) return fail("Your account does not have the orders permission", 403);
  const body = await req.json().catch(() => null);
  const store = loadStore();
  const customer = store.customers.find(
    (c) => c.id === body?.customerId && c.shopId === user.shopId
  );
  if (!customer) return fail("Customer not found in your shop", 404);

  const rawItems: { productId: string; packSize: string; qty: number }[] = Array.isArray(body?.items)
    ? body.items
    : [];
  if (rawItems.length === 0) return fail("Add at least one item", 422);

  const items: OrderItem[] = [];
  let itemsTotal = 0;
  for (const raw of rawItems) {
    const inv = findInventory(store, user.shopId!, raw.productId, raw.packSize);
    if (!inv) return fail("One item is not in your inventory", 422);
    const qty = Math.max(1, Number(raw.qty) || 1);
    if (availableAcross(store, user.shopId!, raw.productId, raw.packSize) < qty) return fail("Not enough stock for one item", 422);
    const product = store.products.find((p) => p.id === raw.productId);
    const lineTotal = inv.pricePaise * qty;
    items.push({
      productId: raw.productId,
      productName: product?.name ?? raw.productId,
      packSize: inv.packSize,
      qty,
      pricePaise: inv.pricePaise,
      lineTotalPaise: lineTotal,
      costPaise: inv.costPaise,
    });
    itemsTotal += lineTotal;
  }

  const tax = pctOf(itemsTotal, store.config.taxPct);
  const seq = nextSeq(store, "order", 1000);
  const markDelivered = body?.markDelivered !== false;
  const order: Order = {
    id: uid("order_"),
    orderNo: `KK-ORD-${seq}`,
    customerId: customer.id,
    customerName: customer.name,
    mobile: customer.mobile,
    village: customer.village,
    addressLine: "Walk-in at shop",
    deliveryType: "home",
    items,
    itemsTotalPaise: itemsTotal,
    deliveryFeePaise: 0,
    taxPaise: tax,
    totalPaise: itemsTotal + tax,
    supplyTotalPaise: items.reduce((s, i) => s + (i.costPaise ?? 0) * i.qty, 0),
    commissionPaise: 0,
    paymentMethod: "Manual",
    paymentStatus: markDelivered ? "Paid" : "Pending",
    source: "manual",
    shopId: user.shopId,
    status: markDelivered ? "Delivered" : "Pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // Walk-in stock leaves the shelf immediately when recorded as delivered,
  // otherwise it is reserved until fulfilment. Both consume batches FEFO.
  for (const item of items) {
    let remaining = item.qty;
    for (const inv of findBatches(store, user.shopId!, item.productId, item.packSize)) {
      if (remaining <= 0) break;
      if (markDelivered) {
        const take = Math.min(remaining, inv.stock - inv.reserved);
        if (take <= 0) continue;
        inv.stock -= take;
        remaining -= take;
        store.stockMovements.unshift({
          id: uid("mov_"),
          shopId: user.shopId!,
          inventoryId: inv.id,
          productId: item.productId,
          delta: -take,
          reason: `Walk-in sale ${order.orderNo}`,
          actorId: user.id,
          at: new Date().toISOString(),
        });
      } else {
        const take = Math.min(remaining, inv.stock - inv.reserved);
        if (take <= 0) continue;
        inv.reserved += take;
        remaining -= take;
      }
    }
  }
  store.orders.push(order);
  if (markDelivered) {
    recordOrderPayment(store, order, "manual", "Paid at shop counter", user.id);
  }
  recordHistory(store, order, order.status, user.id, user.role, "Walk-in order recorded by shop");
  audit(store, user.id, user.role, "order.manual", "order", order.id, order.orderNo);
  saveStore();
  return json({ order: serializeOrder(order, user) }, 201);
}
