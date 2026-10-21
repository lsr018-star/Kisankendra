"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import { useLang } from "@/components/LanguageProvider";
import ProductCard, { type ProductView } from "@/components/ProductCard";

function CatalogueInner() {
  const { t } = useLang();
  const params = useSearchParams();
  const [products, setProducts] = useState<ProductView[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [brand, setBrand] = useState("");
  const [availability, setAvailability] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category) sp.set("category", category);
    if (brand) sp.set("brand", brand);
    if (availability) sp.set("availability", availability);
    if (maxPrice) sp.set("maxPrice", String(Math.round(Number(maxPrice) * 100)));
    setLoading(true);
    api<{ products: ProductView[]; brands: string[] }>(`/api/products?${sp.toString()}`)
      .then((r) => {
        setProducts(r.products);
        setBrands(r.brands);
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load products"))
      .finally(() => setLoading(false));
  }, [q, category, brand, availability, maxPrice]);

  const suggestions = useMemo(() => {
    if (!q) return [];
    const names = [...new Set(products.map((p) => p.name))];
    return names.slice(0, 5);
  }, [q, products]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-leaf-900">{t("catalogue")}</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-[240px_1fr]">
        <form className="card flex flex-col gap-3 self-start" onSubmit={(e) => e.preventDefault()} aria-label="Filters">
          <div>
            <label className="label" htmlFor="f-q">{t("search")}</label>
            <input id="f-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchHint")} list="suggestions" />
            <datalist id="suggestions">
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="f-cat">{t("category")}</label>
            <select id="f-cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              <option value="Pesticides">{t("pesticides")}</option>
              <option value="Fertilizers">{t("fertilizers")}</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-brand">{t("brandLabel")}</label>
            <select id="f-brand" className="input" value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="">All</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-avail">Availability</label>
            <select id="f-avail" className="input" value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="">All</option>
              <option value="in">{t("inStock")}</option>
              <option value="low">{t("lowStock")}</option>
              <option value="out">{t("outOfStock")}</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-price">Max price (₹)</label>
            <input id="f-price" className="input" inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="1000" />
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setQ("");
              setCategory("");
              setBrand("");
              setAvailability("");
              setMaxPrice("");
            }}
          >
            Clear filters
          </button>
        </form>

        <div>
          {loading && <p className="text-neutral-600">Loading products…</p>}
          {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
          {!loading && !error && products.length === 0 && (
            <div className="card text-center">
              <p className="text-lg font-semibold">{t("noResults")}</p>
              <p className="text-neutral-600">Try a different product name, brand, or clear the filters.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CataloguePage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <CatalogueInner />
    </Suspense>
  );
}
