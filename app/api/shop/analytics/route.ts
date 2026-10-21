import { loadStore } from "@/lib/db";
import { isResponse, json, requireShopUser } from "@/lib/api-helpers";
import { computeAnalytics } from "@/lib/analytics";

export async function GET() {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  const store = loadStore();
  return json({ analytics: computeAnalytics(store, user.shopId!) });
}
