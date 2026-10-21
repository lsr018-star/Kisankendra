import { loadStore, saveStore, audit } from "@/lib/db";
import { fail, isResponse, json, requireShopUser } from "@/lib/api-helpers";
import { hasPermission } from "@/lib/auth";
import { daysToExpiry, isExpired } from "@/lib/products";
import { uid } from "@/lib/password";
import type { User } from "@/lib/types";

function canManageInventory(user: User): boolean {
  return user.role !== "shop_staff" || hasPermission(user, "inventory");
}

export async function GET() {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  const store = loadStore();
  const hideCosts = user.role === "shop_staff" && !(user.permissions ?? []).includes("finance");
  const rows = store.inventory
    .filter((i) => i.shopId === user.shopId)
    .map((i) => {
      const product = store.products.find((p) => p.id === i.productId);
      const expired = isExpired(i);
      const dte = daysToExpiry(i);
      const base = {
        id: i.id,
        productId: i.productId,
        productName: product?.name ?? i.productId,
        brand: product?.brand ?? "",
        packSize: i.packSize,
        sku: i.sku,
        batch: i.batch,
        expiry: i.expiry,
        expired,
        nearExpiry: !expired && dte <= store.config.nearExpiryDays,
        daysToExpiry: dte,
        pricePaise: i.pricePaise,
        stock: i.stock,
        reserved: i.reserved,
        available: expired ? 0 : i.stock - i.reserved,
        lowStock: !expired && i.stock - i.reserved <= store.config.lowStockThreshold,
      };
      return hideCosts ? base : { ...base, costPaise: i.costPaise };
    })
    .sort((a, b) => a.expiry.localeCompare(b.expiry));
  const alerts = {
    lowStock: rows.filter((r) => r.lowStock && r.stock > 0).length,
    nearExpiry: rows.filter((r) => r.nearExpiry).length,
    expired: rows.filter((r) => r.expired).length,
  };
  const movements = store.stockMovements.filter((m) => m.shopId === user.shopId).slice(0, 20);
  // Catalogue list so the shop can add batches for products it does not
  // stock yet (also used by the new-shop onboarding workflow).
  const products = store.products
    .filter((p) => p.active)
    .map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      sku: p.sku,
      packSizes: p.packSizes,
    }));
  return json({ inventory: rows, movements, alerts, products });
}

export async function POST(req: Request) {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  // Stock changes are an owner-level (or inventory-permission) action.
  if (!canManageInventory(user)) {
    return fail("Your account does not have the inventory permission", 403);
  }
  const body = await req.json().catch(() => null);
  const action = String(body?.action ?? "adjust");
  const store = loadStore();

  if (action === "create") {
    // Add a new batch line (also the new-stock onboarding path).
    const product = store.products.find((p) => p.id === String(body?.productId ?? ""));
    if (!product) return fail("Product not found in the catalogue", 422);
    const pack = product.packSizes.find((p) => p.size === String(body?.packSize ?? ""));
    if (!pack) return fail("Pack size not available for this product", 422);
    const batch = String(body?.batch ?? "").trim();
    const expiry = String(body?.expiry ?? "").trim();
    const stock = Number(body?.stock ?? 0);
    const costPaise = Number(body?.costPaise ?? 0);
    const pricePaise = Number(body?.pricePaise ?? pack.pricePaise);
    if (!batch) return fail("Batch number is required", 422);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return fail("Expiry date must be YYYY-MM-DD", 422);
    if (!Number.isFinite(stock) || stock < 0) return fail("Stock must be zero or more", 422);
    if (!Number.isFinite(costPaise) || costPaise < 0) return fail("Cost price is required", 422);
    if (
      store.inventory.some(
        (i) => i.shopId === user.shopId && i.productId === product.id && i.packSize === pack.size && i.batch === batch
      )
    ) {
      return fail("This batch already exists for the product and pack size. Edit it instead.", 409);
    }
    const row = {
      id: uid("inv_"),
      shopId: user.shopId!,
      productId: product.id,
      packSize: pack.size,
      sku: product.sku,
      batch,
      expiry,
      costPaise,
      pricePaise,
      stock,
      reserved: 0,
    };
    store.inventory.push(row);
    store.stockMovements.unshift({
      id: uid("mov_"),
      shopId: user.shopId!,
      inventoryId: row.id,
      productId: product.id,
      delta: stock,
      reason: `New batch ${batch} added`,
      actorId: user.id,
      at: new Date().toISOString(),
    });
    audit(store, user.id, user.role, "inventory.create", "inventory", row.id, `${product.name} ${pack.size} batch ${batch}, stock ${stock}`);
    saveStore();
    return json({ ok: true, inventory: row }, 201);
  }

  if (action === "update") {
    // Edit batch metadata (batch no, expiry, prices) — stock moves via adjust.
    const inv = store.inventory.find((i) => i.id === String(body?.inventoryId ?? ""));
    if (!inv || inv.shopId !== user.shopId) return fail("Inventory item not found", 404);
    if (typeof body?.batch === "string" && body.batch.trim()) inv.batch = body.batch.trim();
    if (typeof body?.expiry === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.expiry)) inv.expiry = body.expiry;
    if (body?.costPaise !== undefined && Number.isFinite(Number(body.costPaise))) inv.costPaise = Number(body.costPaise);
    if (body?.pricePaise !== undefined && Number.isFinite(Number(body.pricePaise))) inv.pricePaise = Number(body.pricePaise);
    audit(store, user.id, user.role, "inventory.update", "inventory", inv.id, `Batch ${inv.batch}, expiry ${inv.expiry}`);
    saveStore();
    return json({ ok: true, inventory: inv });
  }

  // Default: stock adjustment on an existing batch line.
  const inventoryId = String(body?.inventoryId ?? "");
  const delta = Number(body?.delta ?? 0);
  const reason = String(body?.reason ?? "").trim();
  if (!inventoryId || !Number.isFinite(delta) || delta === 0 || !reason) {
    return fail("inventoryId, a non-zero delta and a reason are required", 422);
  }
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
