import { loadStore } from "@/lib/db";
import { isResponse, json, requireRole } from "@/lib/api-helpers";
import { computeAnalytics } from "@/lib/analytics";

export async function GET(req: Request) {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const store = loadStore();
  const shopId = new URL(req.url).searchParams.get("shopId") || null;
  return json({
    analytics: computeAnalytics(store, shopId),
    shops: store.shops.map((s) => ({ id: s.id, name: s.name })),
  });
}
