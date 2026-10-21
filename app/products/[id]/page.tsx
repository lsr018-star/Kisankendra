"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import { useLang } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";
import { ProductTile, type ProductView } from "@/components/ProductCard";

interface ProductDetail extends ProductView {
  description: string;
  labelInfo: string;
  warnings: string;
  sku: string;
  perPack: Record<string, number>;
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLang();
  const cart = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState("");
  const [packSize, setPackSize] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api<{ product: ProductDetail }>(`/api/products/${id}`)
      .then((r) => {
        setProduct(r.product);
        setPackSize(r.product.packSizes[0]?.size ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Product not found"));
  }, [id]);

  if (error) {
    return (
      <div className="card">
        <p role="alert" className="text-red-800">{error}</p>
        <Link href="/catalogue" className="btn-secondary mt-3">{t("catalogue")}</Link>
      </div>
    );
  }
  if (!product) return <p>Loading…</p>;

  const pack = product.packSizes.find((p) => p.size === packSize) ?? product.packSizes[0];
  const packAvail = product.perPack[pack.size] ?? 0;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="overflow-hidden rounded-xl ring-1 ring-leaf-100">
        <ProductTile name={product.name} color={product.tileColor} />
        <div className="bg-white p-4">
          <p className="text-sm text-neutral-600">SKU: {product.sku}</p>
          <p className="mt-2 text-neutral-800">{product.description}</p>
          <p className="mt-2 text-sm text-neutral-600">Suitable crops (per label): {product.crops.join(", ")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="card">
          <h1 className="text-2xl font-bold text-leaf-900">{product.name}</h1>
          <p className="text-neutral-600">{product.brand} · {product.category}</p>
          <div className="mt-3">
            <label className="label" htmlFor="pack">{t("packSize")}</label>
            <select id="pack" className="input" value={packSize} onChange={(e) => setPackSize(e.target.value)}>
              {product.packSizes.map((p) => (
                <option key={p.size} value={p.size}>
                  {p.size} — {inr(p.pricePaise)}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-sm">
            {packAvail > 0 ? (
              <span className="font-semibold text-leaf-700">{t("inStock")}: {packAvail} available</span>
            ) : (
              <span className="font-semibold text-red-700">{t("outOfStock")} for this pack size</span>
            )}
          </p>
          <div className="mt-3 flex items-end gap-3">
            <div>
              <label className="label" htmlFor="qty">{t("quantity")}</label>
              <input
                id="qty"
                type="number"
                min={1}
                max={999}
                className="input w-24"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <p className="text-2xl font-extrabold text-leaf-800">{inr(pack.pricePaise * qty)}</p>
          </div>
          <button
            className="btn-primary mt-4 w-full"
            disabled={packAvail === 0}
            onClick={() => {
              cart.add(
                {
                  productId: product.id,
                  productName: product.name,
                  packSize: pack.size,
                  pricePaise: pack.pricePaise,
                  tileColor: product.tileColor,
                  initials: product.initials,
                },
                qty
              );
              setAdded(true);
            }}
          >
            {t("addToCart")}
          </button>
          {added && (
            <p className="mt-2 text-leaf-800" role="status">
              Added to cart. <Link href="/cart" className="font-semibold underline">Go to {t("cart")}</Link>
            </p>
          )}
          <p className="mt-3 text-xs text-neutral-500">{t("soldVia")}</p>
        </div>

        <div className="card">
          <h2 className="font-bold text-leaf-900">Label Information</h2>
          <p className="mt-1 whitespace-pre-line text-sm text-neutral-700">{product.labelInfo}</p>
          <h2 className="mt-4 font-bold text-red-800">Warnings</h2>
          <p className="mt-1 whitespace-pre-line text-sm text-neutral-700">{product.warnings}</p>
        </div>
      </div>
    </div>
  );
}
