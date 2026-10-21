import { loadStore, saveStore, nextSeq, audit } from "@/lib/db";
import { fail, isResponse, json, requireShopUser } from "@/lib/api-helpers";
import { hasPermission } from "@/lib/auth";
import { uid } from "@/lib/password";
import type { Customer } from "@/lib/types";

export async function GET(req: Request) {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  if (!hasPermission(user, "customers")) return fail("Your account does not have the customers permission", 403);
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
  const store = loadStore();
  // Tenant isolation: strictly this shop's customers only.
  let customers = store.customers.filter((c) => c.shopId === user.shopId);
  if (q) {
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }
  return json({ customers });
}

export async function POST(req: Request) {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  if (!hasPermission(user, "customers")) return fail("Your account does not have the customers permission", 403);
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const mobile = String(body?.mobile ?? "").trim();
  const village = String(body?.village ?? "").trim();
  if (!name || !mobile || !village) return fail("Name, mobile and village are required", 422);
  if (!/^[6-9]\d{9}$/.test(mobile)) return fail("Enter a valid 10-digit mobile number", 422);

  const store = loadStore();
  const existing = store.customers.find((c) => c.shopId === user.shopId && c.mobile === mobile);
  if (existing) return fail("A customer with this mobile already exists in your shop", 409);

  const seq = nextSeq(store, "cust_" + user.shopId, 1000);
  const customer: Customer = {
    id: uid("cust_"),
    shopId: user.shopId!,
    customerCode: `KK-${user.shopId!.replace("shop_", "").toUpperCase()}-${seq}`,
    name,
    mobile,
    village,
    addresses: body?.addressLine
      ? [
          {
            id: uid("addr_"),
            label: "Home",
            name,
            mobile,
            village,
            addressLine: String(body.addressLine),
            deliveryType: "home",
          },
        ]
      : [],
    consentMarketing: Boolean(body?.consentMarketing),
    consentRecordedAt: body?.consentMarketing ? new Date().toISOString() : undefined,
    notes: [],
    createdAt: new Date().toISOString(),
  };
  store.customers.push(customer);
  audit(store, user.id, user.role, "customer.create", "customer", customer.id, customer.customerCode);
  saveStore();
  return json({ customer }, 201);
}
