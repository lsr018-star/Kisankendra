"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import AdminNav from "@/components/AdminNav";

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  sku: string;
  active: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);

  const load = () =>
    api<{ products: ProductRow[] }>("/api/admin/products").then((r) => setProducts(r.products)).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const toggle = async (p: ProductRow) => {
    await api("/api/admin/products", { method: "PATCH", body: JSON.stringify({ id: p.id, active: !p.active }) });
    load();
  };

  return (
    <div>
      <AdminNav />
      <h2 className="text-lg font-bold text-leaf-900">Catalogue Moderation</h2>
      <p className="text-sm text-neutral-600">Deactivated products disappear from the farmer catalogue immediately.</p>
      <div className="mt-3 overflow-x-auto rounded-xl bg-white ring-1 ring-leaf-100">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-leaf-50">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Category</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-semibold">{p.name}</td>
                <td className="p-3">{p.brand}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">{p.sku}</td>
                <td className="p-3">{p.active ? "Active" : "Deactivated"}</td>
                <td className="p-3">
                  <button className="btn-secondary" onClick={() => toggle(p)}>
                    {p.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
