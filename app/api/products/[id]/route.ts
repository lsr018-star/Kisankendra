import { loadStore } from "@/lib/db";
import { fail, json } from "@/lib/api-helpers";
import { serializeProduct } from "@/lib/products";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = loadStore();
  const product = store.products.find((p) => p.id === id);
  if (!product) return fail("Product not found", 404);
  return json({ product: serializeProduct(store, product) });
}
