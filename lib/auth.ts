import { cookies } from "next/headers";
import { loadStore } from "./db";
import { verifySessionToken } from "./password";
import { pgEnabled, fetchUserByIdFromPg } from "./pg";
import type { User } from "./types";

export { hashPassword, verifyPassword, newToken, createSessionToken, verifySessionToken } from "./password";

export const SESSION_COOKIE = "kk_session";

export async function getSessionUser(): Promise<User | null> {
  const store = loadStore();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  // Primary: stateless signed token — verifiable by any server instance.
  const signedUserId = verifySessionToken(token);
  if (signedUserId) {
    const local = store.users.find((u) => u.id === signedUserId);
    if (local) return local;
    // This instance booted before the user registered, so its in-memory
    // store does not know them yet. Fall back to Postgres and adopt the
    // record — without this, a valid login is wrongly treated as logged
    // out on older instances (the "asks for login again" bug).
    if (pgEnabled()) {
      const fromPg = await fetchUserByIdFromPg(signedUserId).catch(() => null);
      if (fromPg) {
        store.users.push(fromPg);
        return fromPg;
      }
    }
    return null;
  }
  // Legacy fallback: server-side session rows (pre-fix cookies, local dev).
  const session = store.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  return store.users.find((u) => u.id === session.userId) ?? null;
}

export function publicUser(u: User) {
  return {
    id: u.id,
    role: u.role,
    name: u.name,
    email: u.email,
    mobile: u.mobile,
    shopId: u.shopId,
    permissions: u.permissions ?? [],
    language: u.language,
    village: u.village,
  };
}

export function hasPermission(u: User, perm: string): boolean {
  if (u.role === "shop_owner" || u.role === "admin") return true;
  if (u.role === "shop_staff") return (u.permissions ?? []).includes(perm);
  return false;
}
