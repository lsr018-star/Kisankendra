import { cookies } from "next/headers";
import { loadStore } from "./db";
import type { User } from "./types";

export { hashPassword, verifyPassword, newToken } from "./password";

export const SESSION_COOKIE = "kk_session";

export async function getSessionUser(): Promise<User | null> {
  const store = loadStore();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
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
