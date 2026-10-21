import { loadStore, saveStore, audit } from "@/lib/db";
import { fail, isResponse, json, requireShopUser } from "@/lib/api-helpers";
import { hasPermission } from "@/lib/auth";
import { serializeOrder } from "@/lib/orders";
import { uid } from "@/lib/password";

async function loadCustomer(id: string) {
  const user = await requireShopUser();
  if (isResponse(user)) return { error: user };
  if (!hasPermission(user, "customers")) {
    return { error: fail("Your account does not have the customers permission", 403) };
  }
  const store = loadStore();
  const customer = store.customers.find((c) => c.id === id);
  // Tenant isolation: another shop's customer is invisible (404).
  if (!customer || customer.shopId !== user.shopId) {
    return { error: fail("Customer not found", 404) };
  }
  return { user, store, customer };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await loadCustomer(id);
  if ("error" in r) return r.error;
  const { store, customer, user } = r;

  const shopOrders = store.orders.filter(
    (o) => o.customerId === customer.id && o.shopId === user.shopId
  );
  const platformOrders = shopOrders.filter((o) => o.source === "platform");
  const manualOrders = shopOrders.filter((o) => o.source === "manual");
  const assignedPending = platformOrders.filter((o) =>
    ["Pending", "Accepted", "Processing", "Ready for Dispatch", "Out for Delivery"].includes(o.status)
  );
  const totalPurchaseValue = shopOrders
    .filter((o) => o.status === "Delivered")
    .reduce((s, o) => s + o.totalPaise, 0);
  const tickets = store.tickets.filter((t) => t.mobile === customer.mobile);

  return json({
    customer,
    platformOrders: platformOrders.map((o) => serializeOrder(o, user)),
    manualOrders: manualOrders.map((o) => serializeOrder(o, user)),
    assignedPending: assignedPending.map((o) => serializeOrder(o, user)),
    totalPurchaseValuePaise: totalPurchaseValue,
    supportHistory: tickets,
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await loadCustomer(id);
  if ("error" in r) return r.error;
  const { store, customer, user } = r;
  const body = await req.json().catch(() => null);
  if (typeof body?.name === "string" && body.name.trim()) customer.name = body.name.trim();
  if (typeof body?.village === "string") customer.village = body.village;
  if (typeof body?.consentMarketing === "boolean") {
    customer.consentMarketing = body.consentMarketing;
    customer.consentRecordedAt = new Date().toISOString();
  }
  audit(store, user.id, user.role, "customer.update", "customer", customer.id, customer.customerCode);
  saveStore();
  return json({ customer });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await loadCustomer(id);
  if ("error" in r) return r.error;
  const { store, customer, user } = r;
  const body = await req.json().catch(() => null);
  if (body?.action === "note") {
    const text = String(body.text ?? "").trim();
    if (!text) return fail("Note text is required", 422);
    customer.notes.unshift({ text, at: new Date().toISOString(), by: user.name });
    saveStore();
    return json({ customer });
  }
  if (body?.action === "reminder") {
    const text = String(body.text ?? "").trim();
    if (!text) return fail("Reminder text is required", 422);
    const reminder = {
      id: uid("rem_"),
      shopId: user.shopId!,
      customerId: customer.id,
      type: "follow-up" as const,
      text,
      dueDate: String(body.dueDate ?? new Date().toISOString().slice(0, 10)),
      done: false,
      createdAt: new Date().toISOString(),
    };
    store.reminders.unshift(reminder);
    saveStore();
    return json({ reminder }, 201);
  }
  return fail("Unknown action", 422);
}
