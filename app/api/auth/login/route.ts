import { loadStore, saveStore, audit } from "@/lib/db";
import { fail, json } from "@/lib/api-helpers";
import { createSessionToken, publicUser, verifyPassword, SESSION_COOKIE } from "@/lib/auth";
import { pgEnabled, fetchUserByIdentifierFromPg } from "@/lib/pg";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const identifier = String(body?.identifier ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!identifier || !password) return fail("Enter your email or mobile number and password", 422);

  const store = loadStore();
  let user = store.users.find(
    (u) => u.email?.toLowerCase() === identifier || u.mobile === identifier
  );
  if (!user && pgEnabled()) {
    // Instance booted before this account registered: look it up in
    // Postgres and adopt it locally instead of wrongly answering 401.
    const fromPg = await fetchUserByIdentifierFromPg(identifier).catch(() => null);
    if (fromPg) {
      store.users.push(fromPg);
      user = fromPg;
    }
  }
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return fail("Invalid login details. Please check and try again.", 401);
  }
  // Stateless signed token: verifiable by every server instance, unlike a
  // server-side session row (see lib/password.ts).
  const token = createSessionToken(user.id);
  audit(store, user.id, user.role, "auth.login", "user", user.id, "User logged in");
  saveStore();

  const res = json({ user: publicUser(user) });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 3600,
  });
  return res;
}
