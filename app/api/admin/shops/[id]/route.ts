import { loadStore, saveStore, audit } from "@/lib/db";
import { fail, isResponse, json, requireRole } from "@/lib/api-helpers";
import type { ShopStatus } from "@/lib/types";

const STATUSES: ShopStatus[] = ["Pending", "Under Review", "Approved", "Suspended", "Rejected"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const store = loadStore();
  const shop = store.shops.find((s) => s.id === id);
  if (!shop) return fail("Shop not found", 404);

  if (body?.status && STATUSES.includes(body.status)) {
    shop.status = body.status as ShopStatus;
    audit(store, user.id, "admin", "shop.status", "shop", shop.id, `Status -> ${shop.status}`);
  }
  if (typeof body?.verifyLicence === "boolean") {
    shop.licences.verified = body.verifyLicence;
    audit(store, user.id, "admin", "shop.licence", "shop", shop.id, `Licence verified = ${body.verifyLicence}`);
  }
  saveStore();
  return json({ shop });
}
