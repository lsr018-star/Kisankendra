import { loadStore, saveStore, audit } from "@/lib/db";
import { fail, json } from "@/lib/api-helpers";
import { hashPassword, publicUser } from "@/lib/auth";
import { uid } from "@/lib/password";
import { pgEnabled, flushPgWrites } from "@/lib/pg";
import type { User } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const mobile = String(body?.mobile ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const village = String(body?.village ?? "").trim();
  if (!name || !mobile || password.length < 6) {
    return fail("Name, mobile and a password of at least 6 characters are required", 422);
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) return fail("Enter a valid 10-digit mobile number", 422);

  const store = loadStore();
  const clash = store.users.find(
    (u) => u.mobile === mobile || (email && u.email?.toLowerCase() === email)
  );
  if (clash) return fail("An account with this mobile or email already exists. Please login.", 409);

  const user: User = {
    id: uid("user_"),
    role: "farmer",
    name,
    email: email || undefined,
    mobile,
    passwordHash: hashPassword(password),
    language: "en",
    village,
    addresses: [],
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  audit(store, user.id, "farmer", "auth.register", "user", user.id, "Farmer registered");
  saveStore();
  // A registration must be durable before we answer: on serverless the
  // fire-and-forget write queue can be frozen before it lands.
  if (pgEnabled()) await flushPgWrites();
  return json({ user: publicUser(user) }, 201);
}
