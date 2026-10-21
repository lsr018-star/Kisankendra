import { loadStore, saveStore, audit } from "@/lib/db";
import { fail, isResponse, json, requireRole } from "@/lib/api-helpers";

export async function GET() {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const store = loadStore();
  return json({ products: store.products });
}

export async function PATCH(req: Request) {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => null);
  const store = loadStore();
  const product = store.products.find((p) => p.id === body?.id);
  if (!product) return fail("Product not found", 404);
  if (typeof body?.active === "boolean") {
    product.active = body.active;
    audit(store, user.id, "admin", "product.moderation", "product", product.id, `active = ${body.active}`);
    saveStore();
  }
  return json({ product });
}
