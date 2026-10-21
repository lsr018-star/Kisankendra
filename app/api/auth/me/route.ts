import { loadStore, saveStore } from "@/lib/db";
import { currentUser, fail, json } from "@/lib/api-helpers";
import { publicUser } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  if (!user) return fail("Not logged in", 401);
  const store = loadStore();
  let shop = undefined;
  if (user.shopId) {
    const s = store.shops.find((x) => x.id === user.shopId);
    if (s) shop = { id: s.id, name: s.name, status: s.status, licencesVerified: s.licences.verified, licences: s.licences, villages: s.villages, deliveryCapable: s.deliveryCapable, address: s.address };
  }
  return json({ user: publicUser(user), shop });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Not logged in", 401);
  const body = await req.json().catch(() => null);
  const store = loadStore();
  const fresh = store.users.find((u) => u.id === user.id)!;
  if (body?.language === "en" || body?.language === "hi") fresh.language = body.language;
  if (typeof body?.name === "string" && body.name.trim()) fresh.name = body.name.trim();
  if (typeof body?.village === "string") fresh.village = body.village;
  saveStore();
  return json({ user: publicUser(fresh) });
}
