import { loadStore } from "@/lib/db";
import { isResponse, json, requireShopUser } from "@/lib/api-helpers";
import { OPEN_STATUSES } from "@/lib/assignment";
import { daysToExpiry, isExpired } from "@/lib/products";

export async function GET() {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  const store = loadStore();
  const shopId = user.shopId!;
  const today = new Date();
  const isToday = (iso: string) => {
    const d = new Date(iso);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };
  const isThisMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };
  const myOrders = store.orders.filter((o) => o.shopId === shopId);
  const myCustomers = store.customers.filter((c) => c.shopId === shopId);
  const myInventory = store.inventory.filter((i) => i.shopId === shopId);
  const lowStock = myInventory
    .filter((i) => i.stock - i.reserved <= store.config.lowStockThreshold)
    .map((i) => ({
      inventoryId: i.id,
      productId: i.productId,
      productName: store.products.find((p) => p.id === i.productId)?.name ?? i.productId,
      packSize: i.packSize,
      stock: i.stock,
      reserved: i.reserved,
      available: i.stock - i.reserved,
    }));
  const expiryAlerts = myInventory
    .map((i) => {
      const expired = isExpired(i);
      const dte = daysToExpiry(i);
      return {
        inventoryId: i.id,
        productId: i.productId,
        productName: store.products.find((p) => p.id === i.productId)?.name ?? i.productId,
        packSize: i.packSize,
        batch: i.batch,
        expiry: i.expiry,
        daysToExpiry: dte,
        expired,
        stock: i.stock,
      };
    })
    .filter((a) => a.expired || a.daysToExpiry <= store.config.nearExpiryDays)
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
    .slice(0, 8);
  const sales = myOrders
    .filter((o) => o.status === "Delivered")
    .reduce((sum, o) => sum + o.totalPaise, 0);
  const notifications = store.notifications.filter((n) => n.shopId === shopId).slice(0, 8);
  return json({
    stats: {
      totalCustomers: myCustomers.length,
      ordersToday: myOrders.filter((o) => isToday(o.createdAt)).length,
      ordersThisMonth: myOrders.filter((o) => isThisMonth(o.createdAt)).length,
      salesRecordedPaise: sales,
      pendingOrders: myOrders.filter((o) => OPEN_STATUSES.includes(o.status)).length,
      lowStockCount: lowStock.length,
      nearExpiryCount: expiryAlerts.filter((a) => !a.expired).length,
      expiredCount: expiryAlerts.filter((a) => a.expired).length,
    },
    lowStock,
    expiryAlerts,
    recentOrders: [...myOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      customerName: o.customerName,
      totalPaise: o.totalPaise,
      status: o.status,
      source: o.source,
      createdAt: o.createdAt,
    })),
    notifications,
  });
}
