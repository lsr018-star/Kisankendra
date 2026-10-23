import { loadStore, saveStore, audit } from "@/lib/db";
import { pgEnabled, flushPgWrites } from "@/lib/pg";
import { fail, json } from "@/lib/api-helpers";
import { hashPassword, publicUser } from "@/lib/auth";
import { uid } from "@/lib/password";
import type { Shop, User } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const shopName = String(body?.shopName ?? "").trim();
  const ownerName = String(body?.ownerName ?? "").trim();
  const mobile = String(body?.mobile ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const address = String(body?.address ?? "").trim();
  const villages: string[] = Array.isArray(body?.villages)
    ? body.villages.map((v: unknown) => String(v)).filter(Boolean)
    : [];
  if (!shopName || !ownerName || !mobile || password.length < 6 || villages.length === 0) {
    return fail("Shop name, owner name, mobile, password (6+ characters) and at least one service village are required", 422);
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) return fail("Enter a valid 10-digit mobile number", 422);

  const store = loadStore();
  const clash = store.users.find(
    (u) => u.mobile === mobile || (email && u.email?.toLowerCase() === email)
  );
  if (clash) return fail("An account with this mobile or email already exists. Please login.", 409);

  const shop: Shop = {
    id: uid("shop_"),
    name: shopName,
    ownerName,
    mobile,
    email,
    address,
    villages,
    status: "Pending",
    licences: {
      pesticideNo: String(body?.pesticideLicence ?? "").trim(),
      pesticideExpiry: String(body?.pesticideExpiry ?? "").trim(),
      fertilizerNo: String(body?.fertilizerLicence ?? "").trim(),
      fertilizerExpiry: String(body?.fertilizerExpiry ?? "").trim(),
      verified: false,
    },
    taxDetails: String(body?.taxDetails ?? "").trim(),
    deliveryCapable: Boolean(body?.deliveryCapable),
    createdAt: new Date().toISOString(),
  };
  const user: User = {
    id: uid("user_"),
    role: "shop_owner",
    name: ownerName,
    email: email || undefined,
    mobile,
    passwordHash: hashPassword(password),
    shopId: shop.id,
    language: "en",
    addresses: [],
    createdAt: new Date().toISOString(),
  };
  store.shops.push(shop);
  store.users.push(user);
  audit(store, user.id, "shop_owner", "shop.register", "shop", shop.id, "Shop registered, status Pending");
  saveStore();
  if (pgEnabled()) await flushPgWrites();
  return json({ user: publicUser(user), shopId: shop.id, status: shop.status }, 201);
}
