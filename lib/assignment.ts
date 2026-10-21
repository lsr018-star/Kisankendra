import { pctOf } from "./money";
import { nextSeq, audit } from "./db";
import { isExpired } from "./products";
import { uid } from "./password";
import type { Inventory, Order, Shop, Store } from "./types";

export const OPEN_STATUSES = ["Pending", "Accepted", "Processing", "Ready for Dispatch", "Out for Delivery"];

export function available(inv: Inventory): number {
  return inv.stock - inv.reserved;
}

export function findInventory(
  store: Store,
  shopId: string,
  productId: string,
  packSize: string
): Inventory | undefined {
  return findBatches(store, shopId, productId, packSize)[0];
}

// All batch rows for one product/pack at a shop, earliest expiry first
// (FEFO). Expired batches are excluded — they are not saleable.
export function findBatches(
  store: Store,
  shopId: string,
  productId: string,
  packSize: string
): Inventory[] {
  return store.inventory
    .filter(
      (i) =>
        i.shopId === shopId && i.productId === productId && i.packSize === packSize && !isExpired(i)
    )
    .sort((a, b) => a.expiry.localeCompare(b.expiry));
}

export function availableAcross(
  store: Store,
  shopId: string,
  productId: string,
  packSize: string
): number {
  return findBatches(store, shopId, productId, packSize).reduce((s, i) => s + available(i), 0);
}

interface Scored {
  shop: Shop;
  score: number;
  reason: string;
}

// Eligible = Approved + licence verified (all catalogue products are
// regulated) + serves the village + has enough available stock for ALL items.
export function eligibleShops(store: Store, order: Order, exclude: string[] = []): Scored[] {
  const results: Scored[] = [];
  for (const shop of store.shops) {
    if (exclude.includes(shop.id)) continue;
    if (shop.status !== "Approved") continue;
    if (!shop.licences.verified) continue;
    const villageIndex = shop.villages.indexOf(order.village);
    if (villageIndex === -1) continue;
    const hasAll = order.items.every((item) => {
      return availableAcross(store, shop.id, item.productId, item.packSize) >= item.qty;
    });
    if (!hasAll) continue;
    const openOrders = store.orders.filter(
      (o) => o.shopId === shop.id && OPEN_STATUSES.includes(o.status) && o.id !== order.id
    ).length;
    const score = 100 - villageIndex * 2 - openOrders * 3;
    results.push({
      shop,
      score,
      reason: `Full stock available, village priority ${villageIndex + 1}, open orders ${openOrders}`,
    });
  }
  results.sort((a, b) => b.score - a.score || a.shop.createdAt.localeCompare(b.shop.createdAt));
  return results;
}

export function upsertShopCustomer(store: Store, shopId: string, order: Order): string {
  let customer = store.customers.find((c) => c.shopId === shopId && c.mobile === order.mobile);
  if (!customer) {
    const seq = nextSeq(store, "cust_" + shopId, 1000);
    customer = {
      id: uid("cust_"),
      shopId,
      customerCode: `KK-${shopId.replace("shop_", "").toUpperCase()}-${seq}`,
      name: order.customerName,
      mobile: order.mobile,
      village: order.village,
      addresses: [
        {
          id: uid("addr_"),
          label: "Delivery",
          name: order.customerName,
          mobile: order.mobile,
          village: order.village,
          addressLine: order.addressLine,
          deliveryType: order.deliveryType,
        },
      ],
      consentMarketing: false,
      notes: [],
      linkedUserId: order.farmerId,
      createdAt: new Date().toISOString(),
    };
    store.customers.push(customer);
  }
  return customer.id;
}

// Assign the order to the best eligible shop (or a preferred eligible shop).
// Returns the shop or null when nobody can fulfil the order.
export function assignOrder(
  store: Store,
  order: Order,
  exclude: string[] = [],
  preferredShopId?: string
): Shop | null {
  const candidates = eligibleShops(store, order, exclude);
  if (candidates.length === 0) return null;
  const best = preferredShopId
    ? candidates.find((c) => c.shop.id === preferredShopId) ?? candidates[0]
    : candidates[0];
  const shop = best.shop;

  order.shopId = shop.id;
  order.status = "Pending";
  order.unassignedReason = undefined;

  // Reserve stock FEFO across batch rows and price the supply side from the
  // consumed batches' cost fields (weighted average when batches differ).
  let supply = 0;
  for (const item of order.items) {
    let remaining = item.qty;
    let costSum = 0;
    for (const batch of findBatches(store, shop.id, item.productId, item.packSize)) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, available(batch));
      if (take <= 0) continue;
      batch.reserved += take;
      costSum += batch.costPaise * take;
      remaining -= take;
    }
    item.costPaise = item.qty > 0 ? Math.round(costSum / item.qty) : 0;
    supply += costSum;
  }
  order.supplyTotalPaise = supply;
  order.commissionPaise = pctOf(order.itemsTotalPaise, store.config.commissionPct);

  order.customerId = upsertShopCustomer(store, shop.id, order);

  store.assignments.push({
    id: uid("asg_"),
    orderId: order.id,
    shopId: shop.id,
    status: "Assigned",
    score: best.score,
    reason: best.reason,
    createdAt: new Date().toISOString(),
  });
  store.notifications.unshift({
    id: uid("ntf_"),
    shopId: shop.id,
    text: `New platform order ${order.orderNo} assigned to ${shop.name}.`,
    at: new Date().toISOString(),
    read: false,
  });
  audit(store, "system", "system", "order.assign", "order", order.id, `Assigned to ${shop.name} (score ${best.score})`);
  return shop;
}

export function releaseReservation(store: Store, order: Order): void {
  if (!order.shopId) return;
  for (const item of order.items) {
    let remaining = item.qty;
    // Reservations were placed FEFO, so release them FEFO across batches
    // (including any batch that has since expired).
    const rows = store.inventory
      .filter((i) => i.shopId === order.shopId && i.productId === item.productId && i.packSize === item.packSize)
      .sort((a, b) => a.expiry.localeCompare(b.expiry));
    for (const inv of rows) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, inv.reserved);
      inv.reserved -= take;
      remaining -= take;
    }
  }
}

// On delivery the reserved units leave the shelf (FEFO across batches).
export function applyDelivery(store: Store, order: Order): void {
  if (!order.shopId) return;
  for (const item of order.items) {
    let remaining = item.qty;
    const rows = store.inventory
      .filter((i) => i.shopId === order.shopId && i.productId === item.productId && i.packSize === item.packSize)
      .sort((a, b) => a.expiry.localeCompare(b.expiry));
    for (const inv of rows) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, inv.reserved);
      if (take <= 0) continue;
      inv.stock = Math.max(0, inv.stock - take);
      inv.reserved = Math.max(0, inv.reserved - take);
      remaining -= take;
      store.stockMovements.unshift({
        id: uid("mov_"),
        shopId: order.shopId,
        inventoryId: inv.id,
        productId: item.productId,
        delta: -take,
        reason: `Delivered order ${order.orderNo}`,
        actorId: "system",
        at: new Date().toISOString(),
      });
    }
  }
}

// On return after delivery, units go back on the shelf.
export function applyReturn(store: Store, order: Order): void {
  if (!order.shopId) return;
  for (const item of order.items) {
    const inv = findInventory(store, order.shopId, item.productId, item.packSize);
    if (inv) {
      inv.stock += item.qty;
      store.stockMovements.unshift({
        id: uid("mov_"),
        shopId: order.shopId,
        inventoryId: inv.id,
        productId: item.productId,
        delta: item.qty,
        reason: `Returned order ${order.orderNo}`,
        actorId: "system",
        at: new Date().toISOString(),
      });
    }
  }
}

export function recordHistory(
  store: Store,
  order: Order,
  status: string,
  actorId: string,
  actorRole: string,
  note?: string
): void {
  store.statusHistory.push({
    id: uid("hist_"),
    orderId: order.id,
    status,
    actorId,
    actorRole,
    note,
    at: new Date().toISOString(),
  });
  order.updatedAt = new Date().toISOString();
}
