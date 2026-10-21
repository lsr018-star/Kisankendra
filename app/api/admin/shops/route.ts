import { loadStore } from "@/lib/db";
import { isResponse, json, requireRole } from "@/lib/api-helpers";

export async function GET() {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const store = loadStore();
  return json({ shops: store.shops });
}
