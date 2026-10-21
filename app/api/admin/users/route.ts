import { loadStore } from "@/lib/db";
import { isResponse, json, requireRole } from "@/lib/api-helpers";
import { publicUser } from "@/lib/auth";

export async function GET() {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const store = loadStore();
  return json({ users: store.users.map((u) => publicUser(u)) });
}
