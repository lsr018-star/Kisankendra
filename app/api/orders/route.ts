import { loadStore, saveStore, nextSeq, audit } from "@/lib/db";
import { pgEnabled, flushPgWrites } from "@/lib/pg";
import { currentUser, fail, json } from "@/lib/api-helpers";
import { pctOf } from "@/lib/money";
import { assignOrder, recordHistory } from "@/lib/assignment";
import { serializeOrder } from "@/lib/orders";
import { uid } from "@/lib/password";
import type { Order, OrderItem } from "@/lib/types";

export async function GET() {
  const user = await currentUser();
  if (!user) return fail("Login required", 401);
  const store = loadStore();
  let orders: Order[] = [];
  if (user.role === "farmer") orders = store.orders.filter((o) => o.farmerId === user.id);
  else if (user.role === "shop_owner" || user.role === "shop_staff")
    orders = store.orders.filter((o) => o.shopId === user.shopId);
  else if (user.role === "admin") orders = store.orders;
  orders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return json({ orders: orders.map((o) => serializeOrder(o, user)) });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Login required", 401);
  if (user.role !== "farmer") return fail("Only farmer accounts can place marketplace orders", 403);

  const body = await req.json().catch(() => null);
  const rawItems: { productId: string; packSize: string; qty: number }[] = Array.isArray(body?.items)
    ? body.items
    : [];
  if (rawItems.length === 0) return fail("Your cart is empty", 422);

  const customerName = String(body?.customerName ?? user.name).trim();
  const mobile = String(body?.mobile ?? user.mobile).trim();
  const village = String(body?.village ?? "").trim();
  const addressLine = String(body?.addressLine ?? "").trim();
  const deliveryType = body?.deliveryType === "field" ? "field" : "home";
  const instructions = String(body?.instructions ?? "").trim();
  const paymentMethod = body?.paymentMethod === "Manual" ? "Manual" : "COD";
  if (!village || !addressLine || !mobile) {
    return fail("Name, mobile, village and delivery address are required", 422);
  }

  const store = loadStore();

  // Service area validation: at least one Approved shop must serve the village.
  const serving = store.shops.filter(
    (s) => s.status === "Approved" && s.villages.includes(village)
  );
  if (serving.length === 0) {
    return fail(
      `Kisankendra does not serve ${village} yet. Please choose a nearby served village or contact support.`,
      422,
      { code: "NOT_SERVED" }
    );
  }

  // Price everything from the server-side catalogue. Client prices are ignored.
  const items: OrderItem[] = [];
  let itemsTotal = 0;
  for (const raw of rawItems) {
    const product = store.products.find((p) => p.id === raw.productId && p.active);
    if (!product) return fail("One item in your cart is no longer available", 422);
    const pack = product.packSizes.find((p) => p.size === raw.packSize) ?? product.packSizes[0];
    const qty = Math.max(1, Math.min(999, Number(raw.qty) || 1));
    const lineTotal = pack.pricePaise * qty;
    items.push({
      productId: product.id,
      productName: product.name,
      packSize: pack.size,
      qty,
      pricePaise: pack.pricePaise,
      lineTotalPaise: lineTotal,
    });
    itemsTotal += lineTotal;
  }

  const deliveryFee = store.config.deliveryFeePaise;
  const tax = pctOf(itemsTotal, store.config.taxPct);
  const seq = nextSeq(store, "order", 1000);
  const order: Order = {
    id: uid("order_"),
    orderNo: `KK-ORD-${seq}`,
    farmerId: user.id,
    customerName,
    mobile,
    village,
    addressLine,
    deliveryType,
    instructions: instructions || undefined,
    items,
    itemsTotalPaise: itemsTotal,
    deliveryFeePaise: deliveryFee,
    taxPaise: tax,
    totalPaise: itemsTotal + deliveryFee + tax,
    supplyTotalPaise: 0,
    commissionPaise: 0,
    paymentMethod,
    paymentStatus: "Pending",
    source: "platform",
    status: "Unassigned",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const shop = assignOrder(store, order);
  if (shop) {
    recordHistory(store, order, "Pending", user.id, "farmer", `Order placed, assigned to ${shop.name}`);
  } else {
    order.unassignedReason =
      "No partner shop can fulfil this order right now. You can wait for assignment, choose alternatives, or cancel.";
    recordHistory(store, order, "Unassigned", user.id, "farmer", "Order placed, no eligible shop with full stock");
  }
  store.orders.push(order);
  audit(store, user.id, "farmer", "order.create", "order", order.id, `Order ${order.orderNo} total ${order.totalPaise}`);
  saveStore();
  // Orders must be durable before we answer (same serverless freeze risk
  // as registrations).
  if (pgEnabled()) await flushPgWrites();
  return json({ order: serializeOrder(order, user) }, 201);
}
