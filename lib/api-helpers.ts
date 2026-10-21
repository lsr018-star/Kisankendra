import { NextResponse } from "next/server";
import { getSessionUser } from "./auth";
import type { Role, User } from "./types";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function currentUser(): Promise<User | null> {
  return getSessionUser();
}

export async function requireRole(roles: Role[]): Promise<User | NextResponse> {
  const user = await getSessionUser();
  if (!user) return fail("Login required", 401);
  if (!roles.includes(user.role)) return fail("Not allowed for your role", 403);
  return user;
}

export function isResponse(v: User | NextResponse): v is NextResponse {
  return v instanceof NextResponse;
}

// Shop-scoped user (owner or staff of exactly one shop).
export async function requireShopUser(): Promise<User | NextResponse> {
  const user = await getSessionUser();
  if (!user) return fail("Login required", 401);
  if (user.role !== "shop_owner" && user.role !== "shop_staff") {
    return fail("Shop login required", 403);
  }
  if (!user.shopId) return fail("No shop linked to this account", 403);
  return user;
}
