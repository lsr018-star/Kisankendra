import type { Product, Store } from "./types";

export function productAvailability(store: Store, productId: string) {
  let totalAvailable = 0;
  const perPack: Record<string, number> = {};
  for (const inv of store.inventory) {
    if (inv.productId !== productId) continue;
    const shop = store.shops.find((s) => s.id === inv.shopId);
    if (!shop || shop.status !== "Approved") continue;
    const avail = Math.max(0, inv.stock - inv.reserved);
    totalAvailable += avail;
    perPack[inv.packSize] = (perPack[inv.packSize] ?? 0) + avail;
  }
  return { totalAvailable, perPack };
}

export function serializeProduct(store: Store, p: Product) {
  const { totalAvailable, perPack } = productAvailability(store, p.id);
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    sku: p.sku,
    packSizes: p.packSizes,
    description: p.description,
    labelInfo: p.labelInfo,
    warnings: p.warnings,
    crops: p.crops,
    active: p.active,
    tileColor: p.tileColor,
    initials: p.initials,
    available: totalAvailable,
    perPack,
  };
}
