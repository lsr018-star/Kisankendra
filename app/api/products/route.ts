import { loadStore } from "@/lib/db";
import { json } from "@/lib/api-helpers";
import { serializeProduct } from "@/lib/products";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();
  const category = url.searchParams.get("category") ?? "";
  const brand = url.searchParams.get("brand") ?? "";
  const maxPrice = Number(url.searchParams.get("maxPrice") ?? "0");
  const availability = url.searchParams.get("availability") ?? "";

  const store = loadStore();
  let products = store.products.filter((p) => p.active);
  if (category) products = products.filter((p) => p.category === category);
  if (brand) products = products.filter((p) => p.brand === brand);
  if (q) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.crops.some((c) => c.toLowerCase().includes(q))
    );
  }
  let out = products.map((p) => serializeProduct(store, p));
  if (maxPrice > 0) {
    out = out.filter((p) => Math.min(...p.packSizes.map((x) => x.pricePaise)) <= maxPrice);
  }
  if (availability === "in") out = out.filter((p) => p.available > 5);
  if (availability === "low") out = out.filter((p) => p.available > 0 && p.available <= 5);
  if (availability === "out") out = out.filter((p) => p.available === 0);

  const brands = [...new Set(store.products.filter((p) => p.active).map((p) => p.brand))];
  return json({ products: out, brands });
}
