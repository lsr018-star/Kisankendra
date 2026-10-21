"use client";

import Link from "next/link";
import { inr } from "@/lib/money";
import { useLang } from "./LanguageProvider";
import { useCart } from "./CartProvider";
import ProductArt from "./ProductArt";

export interface ProductView {
  id: string;
  name: string;
  brand: string;
  category: string;
  packSizes: { size: string; pricePaise: number }[];
  tileColor: string;
  initials: string;
  available: number;
  crops: string[];
}

export function ProductTile({ name, color, category = "Pesticides" }: { name: string; color: string; category?: string }) {
  return (
    <div className="overflow-hidden rounded-t-xl">
      <ProductArt name={name} color={color} category={category} />
    </div>
  );
}

export default function ProductCard({ product }: { product: ProductView }) {
  const { t } = useLang();
  const cart = useCart();
  const from = Math.min(...product.packSizes.map((p) => p.pricePaise));
  const defaultPack = product.packSizes[0];
  const badge =
    product.available === 0
      ? { text: t("outOfStock"), cls: "bg-red-100 text-red-800" }
      : product.available <= 5
        ? { text: `${t("lowStock")} (${product.available})`, cls: "bg-amber-100 text-amber-900" }
        : { text: t("inStock"), cls: "bg-leaf-100 text-leaf-800" };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-leaf-100">
      <Link href={`/products/${product.id}`} aria-label={product.name}>
        <ProductTile name={product.name} color={product.tileColor} category={product.category} />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className={`self-start rounded-full px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.text}</span>
        <Link href={`/products/${product.id}`} className="font-semibold text-leaf-900 leading-snug">
          {product.name}
        </Link>
        <p className="text-sm text-neutral-600">
          {product.brand} · {product.category}
        </p>
        <p className="text-sm text-neutral-600">
          {t("packSize")}: {product.packSizes.map((p) => p.size).join(", ")}
        </p>
        <p className="mt-auto text-lg font-bold text-leaf-800">
          {inr(from)}
          <span className="text-xs font-normal text-neutral-500"> onwards</span>
        </p>
        <button
          disabled={product.available === 0}
          onClick={() =>
            cart.add({
              productId: product.id,
              productName: product.name,
              packSize: defaultPack.size,
              pricePaise: defaultPack.pricePaise,
              tileColor: product.tileColor,
              initials: product.initials,
            })
          }
          className="mt-1 min-h-[48px] rounded-lg bg-leaf-600 px-3 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300 hover:bg-leaf-700"
        >
          {t("addToCart")} ({defaultPack.size})
        </button>
      </div>
    </div>
  );
}
