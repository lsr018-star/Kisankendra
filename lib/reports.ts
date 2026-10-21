import type { Order, Store } from "./types";

// Reports are computed from delivered + open order records of the store.
// "Sales" counts orders that reached Delivered (money actually earned);
// margin is the shop's spread: customer item total − supply cost − platform
// commission. Reconciliation compares each non-cancelled order's total with
// the payment records actually collected against it.

export interface DateRange {
  from?: string; // YYYY-MM-DD inclusive
  to?: string; // YYYY-MM-DD inclusive
}

export function inRange(iso: string, range: DateRange): boolean {
  const day = iso.slice(0, 10);
  if (range.from && day < range.from) return false;
  if (range.to && day > range.to) return false;
  return true;
}

export function scopedOrders(store: Store, shopId: string | null, range: DateRange): Order[] {
  return store.orders
    .filter((o) => (shopId ? o.shopId === shopId : true))
    .filter((o) => inRange(o.createdAt, range))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export interface SalesReport {
  summary: {
    orders: number;
    itemsPaise: number;
    deliveryPaise: number;
    taxPaise: number;
    grossPaise: number;
  };
  byProduct: { productId: string; productName: string; packSize: string; qty: number; amountPaise: number }[];
  byDay: { day: string; orders: number; grossPaise: number }[];
  orders: { id: string; orderNo: string; date: string; customerName: string; village: string; source: string; status: string; totalPaise: number }[];
}

export function salesReport(store: Store, shopId: string | null, range: DateRange): SalesReport {
  const delivered = scopedOrders(store, shopId, range).filter((o) => o.status === "Delivered");
  const byProductMap = new Map<string, SalesReport["byProduct"][number]>();
  const byDayMap = new Map<string, { day: string; orders: number; grossPaise: number }>();
  for (const o of delivered) {
    for (const item of o.items) {
      const key = `${item.productId}|${item.packSize}`;
      const row = byProductMap.get(key) ?? {
        productId: item.productId,
        productName: item.productName,
        packSize: item.packSize,
        qty: 0,
        amountPaise: 0,
      };
      row.qty += item.qty;
      row.amountPaise += item.lineTotalPaise;
      byProductMap.set(key, row);
    }
    const day = o.createdAt.slice(0, 10);
    const d = byDayMap.get(day) ?? { day, orders: 0, grossPaise: 0 };
    d.orders += 1;
    d.grossPaise += o.totalPaise;
    byDayMap.set(day, d);
  }
  return {
    summary: {
      orders: delivered.length,
      itemsPaise: delivered.reduce((s, o) => s + o.itemsTotalPaise, 0),
      deliveryPaise: delivered.reduce((s, o) => s + o.deliveryFeePaise, 0),
      taxPaise: delivered.reduce((s, o) => s + o.taxPaise, 0),
      grossPaise: delivered.reduce((s, o) => s + o.totalPaise, 0),
    },
    byProduct: [...byProductMap.values()].sort((a, b) => b.amountPaise - a.amountPaise),
    byDay: [...byDayMap.values()].sort((a, b) => a.day.localeCompare(b.day)),
    orders: delivered.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      date: o.createdAt.slice(0, 10),
      customerName: o.customerName,
      village: o.village,
      source: o.source,
      status: o.status,
      totalPaise: o.totalPaise,
    })),
  };
}

export interface MarginReport {
  summary: { orders: number; itemsPaise: number; supplyPaise: number; commissionPaise: number; marginPaise: number };
  orders: {
    id: string;
    orderNo: string;
    date: string;
    itemsPaise: number;
    supplyPaise: number;
    commissionPaise: number;
    marginPaise: number;
  }[];
}

export function marginReport(store: Store, shopId: string | null, range: DateRange): MarginReport {
  const delivered = scopedOrders(store, shopId, range).filter((o) => o.status === "Delivered");
  const rows = delivered.map((o) => ({
    id: o.id,
    orderNo: o.orderNo,
    date: o.createdAt.slice(0, 10),
    itemsPaise: o.itemsTotalPaise,
    supplyPaise: o.supplyTotalPaise,
    commissionPaise: o.commissionPaise,
    marginPaise: o.itemsTotalPaise - o.supplyTotalPaise - o.commissionPaise,
  }));
  return {
    summary: {
      orders: rows.length,
      itemsPaise: rows.reduce((s, r) => s + r.itemsPaise, 0),
      supplyPaise: rows.reduce((s, r) => s + r.supplyPaise, 0),
      commissionPaise: rows.reduce((s, r) => s + r.commissionPaise, 0),
      marginPaise: rows.reduce((s, r) => s + r.marginPaise, 0),
    },
    orders: rows,
  };
}

export interface ReconciliationReport {
  summary: {
    orders: number;
    expectedPaise: number;
    collectedPaise: number;
    outstandingPaise: number;
    refundedPaise: number;
  };
  byMethod: { method: string; count: number; amountPaise: number }[];
  orders: {
    id: string;
    orderNo: string;
    date: string;
    status: string;
    paymentStatus: string;
    expectedPaise: number;
    collectedPaise: number;
    outstandingPaise: number;
  }[];
}

export function reconciliationReport(store: Store, shopId: string | null, range: DateRange): ReconciliationReport {
  const orders = scopedOrders(store, shopId, range).filter(
    (o) => o.status !== "Cancelled" && o.status !== "Unassigned"
  );
  const rows = orders.map((o) => {
    const collected = store.payments
      .filter((p) => p.orderId === o.id && (p.status === "Paid" || p.status === "Captured"))
      .reduce((s, p) => s + p.amountPaise, 0);
    return {
      id: o.id,
      orderNo: o.orderNo,
      date: o.createdAt.slice(0, 10),
      status: o.status,
      paymentStatus: o.paymentStatus,
      expectedPaise: o.totalPaise,
      collectedPaise: collected,
      outstandingPaise: Math.max(0, o.totalPaise - collected),
    };
  });
  const methodMap = new Map<string, { method: string; count: number; amountPaise: number }>();
  for (const p of store.payments) {
    if (shopId && p.shopId !== shopId) continue;
    if (p.status !== "Paid" && p.status !== "Captured") continue;
    if (!inRange(p.createdAt, range)) continue;
    const key = `${p.provider}:${p.method ?? ""}`;
    const row = methodMap.get(key) ?? { method: key, count: 0, amountPaise: 0 };
    row.count += 1;
    row.amountPaise += p.amountPaise;
    methodMap.set(key, row);
  }
  const refunded = store.refunds
    .filter((r) => (shopId ? store.payments.find((p) => p.id === r.paymentId)?.shopId === shopId : true))
    .filter((r) => r.status === "Processed" && inRange(r.createdAt, range))
    .reduce((s, r) => s + r.amountPaise, 0);
  return {
    summary: {
      orders: rows.length,
      expectedPaise: rows.reduce((s, r) => s + r.expectedPaise, 0),
      collectedPaise: rows.reduce((s, r) => s + r.collectedPaise, 0),
      outstandingPaise: rows.reduce((s, r) => s + r.outstandingPaise, 0),
      refundedPaise: refunded,
    },
    byMethod: [...methodMap.values()],
    orders: rows,
  };
}
