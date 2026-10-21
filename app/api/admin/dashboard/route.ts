import { loadStore } from "@/lib/db";
import { isResponse, json, requireRole } from "@/lib/api-helpers";

export async function GET() {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const store = loadStore();
  const shopsByStatus: Record<string, number> = {};
  for (const s of store.shops) shopsByStatus[s.status] = (shopsByStatus[s.status] ?? 0) + 1;
  const ordersByStatus: Record<string, number> = {};
  for (const o of store.orders) ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
  return json({
    counts: {
      users: store.users.length,
      farmers: store.users.filter((u) => u.role === "farmer").length,
      shops: store.shops.length,
      products: store.products.length,
      orders: store.orders.length,
      unassignedOrders: store.orders.filter((o) => o.status === "Unassigned").length,
      openTickets: store.tickets.filter((t) => t.status !== "Closed").length,
    },
    shopsByStatus,
    ordersByStatus,
    auditLogs: store.auditLogs.slice(0, 15),
    unassignedOrders: store.orders
      .filter((o) => o.status === "Unassigned")
      .map((o) => ({ id: o.id, orderNo: o.orderNo, village: o.village, totalPaise: o.totalPaise, createdAt: o.createdAt })),
  });
}
