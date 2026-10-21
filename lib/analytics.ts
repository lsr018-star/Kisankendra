import type { Order, Store } from "./types";

// Analytics computed from real order records. "Revenue" = Delivered order
// totals. Repeat-customer rate = share of customers (by mobile, within the
// scope) with two or more non-cancelled orders.

export interface AnalyticsData {
  revenueTrend: { day: string; revenuePaise: number; orders: number }[];
  topProducts: { productId: string; productName: string; qty: number; revenuePaise: number }[];
  topVillages: { village: string; orders: number; revenuePaise: number }[];
  repeat: { customers: number; repeatCustomers: number; ratePct: number };
  funnel: { stage: string; count: number }[];
  totals: { orders: number; delivered: number; revenuePaise: number };
}

function scoped(store: Store, shopId: string | null): Order[] {
  return store.orders.filter((o) => (shopId ? o.shopId === shopId : true));
}

export function computeAnalytics(store: Store, shopId: string | null, days = 30): AnalyticsData {
  const orders = scoped(store, shopId);
  const delivered = orders.filter((o) => o.status === "Delivered");

  // Revenue trend: zero-filled day buckets ending today.
  const trend: AnalyticsData["revenueTrend"] = [];
  const byDay = new Map<string, { revenuePaise: number; orders: number }>();
  for (const o of delivered) {
    const day = o.createdAt.slice(0, 10);
    const row = byDay.get(day) ?? { revenuePaise: 0, orders: 0 };
    row.revenuePaise += o.totalPaise;
    row.orders += 1;
    byDay.set(day, row);
  }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = d.toISOString().slice(0, 10);
    const row = byDay.get(day) ?? { revenuePaise: 0, orders: 0 };
    trend.push({ day, revenuePaise: row.revenuePaise, orders: row.orders });
  }

  const productMap = new Map<string, { productId: string; productName: string; qty: number; revenuePaise: number }>();
  for (const o of delivered) {
    for (const item of o.items) {
      const row = productMap.get(item.productId) ?? { productId: item.productId, productName: item.productName, qty: 0, revenuePaise: 0 };
      row.qty += item.qty;
      row.revenuePaise += item.lineTotalPaise;
      productMap.set(item.productId, row);
    }
  }

  const villageMap = new Map<string, { village: string; orders: number; revenuePaise: number }>();
  for (const o of delivered) {
    const row = villageMap.get(o.village) ?? { village: o.village, orders: 0, revenuePaise: 0 };
    row.orders += 1;
    row.revenuePaise += o.totalPaise;
    villageMap.set(o.village, row);
  }

  const perCustomer = new Map<string, number>();
  for (const o of orders) {
    if (o.status === "Cancelled") continue;
    perCustomer.set(o.mobile, (perCustomer.get(o.mobile) ?? 0) + 1);
  }
  const customers = perCustomer.size;
  const repeatCustomers = [...perCustomer.values()].filter((n) => n >= 2).length;

  const funnel: AnalyticsData["funnel"] = [
    { stage: "Placed", count: orders.length },
    { stage: "Assigned", count: orders.filter((o) => o.shopId && o.status !== "Unassigned").length },
    { stage: "Delivered", count: delivered.length },
    { stage: "Cancelled", count: orders.filter((o) => o.status === "Cancelled").length },
    { stage: "Returned", count: orders.filter((o) => o.status === "Returned").length },
    { stage: "Unassigned", count: orders.filter((o) => o.status === "Unassigned").length },
  ];

  return {
    revenueTrend: trend,
    topProducts: [...productMap.values()].sort((a, b) => b.revenuePaise - a.revenuePaise).slice(0, 8),
    topVillages: [...villageMap.values()].sort((a, b) => b.orders - a.orders).slice(0, 8),
    repeat: {
      customers,
      repeatCustomers,
      ratePct: customers === 0 ? 0 : Math.round((repeatCustomers / customers) * 100),
    },
    funnel,
    totals: {
      orders: orders.length,
      delivered: delivered.length,
      revenuePaise: delivered.reduce((s, o) => s + o.totalPaise, 0),
    },
  };
}
