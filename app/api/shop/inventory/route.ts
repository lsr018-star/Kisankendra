import { loadStore, saveStore, audit } from "@/lib/db";
import { fail, isResponse, json, requireShopUser } from "@/lib/api-helpers";
import { hasPermission } from "@/lib/auth";
import { uid } from "@/lib/password";

export async function GET() {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  const store = loadStore();
  const hideCosts = user.role === "shop_staff" && !(user.permissions ?? []).includes("finance");
  const rows = store.inventory
    .filter((i) => i.shopId === user.shopId)
    .map((i) => {
      const product = store.products.find((p) => p.id === i.productId);
      const base = {
        id: i.id,
        productId: i.productId,
        productName: product?.name ?? i.productId,
        brand: product?.brand ?? "",
        packSize: i.packSize,
        sku: i.sku,
        batch: i.batch,
        expiry: i.expiry,
        pricePaise: i.pricePaise,
        stock: i.stock,
        reserved: i.reserved,
        available: i.stock - i.reserved,
        lowStock: i.stock - i.reserved <= store.config.lowStockThreshold,
      };
      return hideCosts ? base : { ...base, costPaise: i.costPaise };
    });
  const movements = store.stockMovements.filter((m) => m.shopId === user.shopId).slice(0, 20);
  return json({ inventory: rows, movements });
}

export async function POST(req: Request) {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  // Stock adjustment is an owner-level (or inventory-permission) action.
  if (user.role === "shop_staff" && !hasPermission(user, "inventory")) {
    return fail("Your account does not have the inventory permission", 403);
  }
  const body = await req.json().catch(() => null);
  const inventoryId = String(body?.inventoryId ?? "");
  const delta = Number(body?.delta ?? 0);
  const reason = String(body?.reason ?? "").trim();
  if (!inventoryId || !Number.isFinite(delta) || delta === 0 || !reason) {
    return fail("inventoryId, a non-zero delta and a reason are required", 422);
  }
  const store = loadStore();
  const inv = store.inventory.find((i) => i.id === inventoryId);
  if (!inv || inv.shopId !== user.shopId) return fail("Inventory item not found", 404);
  inv.stock = Math.max(0, inv.stock + delta);
  store.stockMovements.unshift({
    id: uid("mov_"),
    shopId: user.shopId!,
    inventoryId: inv.id,
    productId: inv.productId,
    delta,
    reason,
    actorId: user.id,
    at: new Date().toISOString(),
  });
  audit(store, user.id, user.role, "inventory.adjust", "inventory", inv.id, `${delta > 0 ? "+" : ""}${delta}: ${reason}`);
  saveStore();
  return json({ ok: true, stock: inv.stock });
}
