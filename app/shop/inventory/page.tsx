"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import { useLang } from "@/components/LanguageProvider";
import ShopNav from "@/components/ShopNav";

interface InvRow {
  id: string;
  productName: string;
  brand: string;
  packSize: string;
  sku: string;
  batch: string;
  expiry: string;
  pricePaise: number;
  costPaise?: number;
  stock: number;
  reserved: number;
  available: number;
  lowStock: boolean;
}

interface Movement {
  id: string;
  delta: number;
  reason: string;
  at: string;
}

export default function ShopInventoryPage() {
  const { t } = useLang();
  const [rows, setRows] = useState<InvRow[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [msg, setMsg] = useState("");
  const [adjust, setAdjust] = useState<Record<string, { delta: string; reason: string }>>({});

  const load = () =>
    api<{ inventory: InvRow[]; movements: Movement[] }>("/api/shop/inventory")
      .then((r) => {
        setRows(r.inventory);
        setMovements(r.movements);
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Could not load inventory"));

  useEffect(() => {
    load();
  }, []);

  const submitAdjust = async (id: string) => {
    const a = adjust[id];
    if (!a) return;
    setMsg("");
    try {
      await api("/api/shop/inventory", {
        method: "POST",
        body: JSON.stringify({ inventoryId: id, delta: Number(a.delta), reason: a.reason }),
      });
      setMsg("Stock updated and recorded in the audit history.");
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Adjustment failed");
    }
  };

  return (
    <div>
      <ShopNav />
      <h2 className="text-lg font-bold text-leaf-900">{t("inventory")}</h2>
      <p className="text-sm text-neutral-600">Purchase cost is confidential: it is visible only to the shop owner and authorised finance roles of this shop.</p>
      {msg && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-amber-900" role="status">{msg}</p>}
      <div className="mt-3 overflow-x-auto rounded-xl bg-white ring-1 ring-leaf-100">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-leaf-50">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">SKU / Batch</th>
              <th className="p-3">Expiry</th>
              <th className="p-3">Sell Price</th>
              <th className="p-3">Cost</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Reserved</th>
              <th className="p-3">Available</th>
              <th className="p-3">Adjust Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t ${r.lowStock ? "bg-red-50" : ""}`}>
                <td className="p-3">
                  <span className="font-semibold">{r.productName}</span>
                  <span className="block text-xs text-neutral-500">{r.brand} · {r.packSize}</span>
                  {r.lowStock && <span className="text-xs font-bold text-red-700">{t("lowStock")}</span>}
                </td>
                <td className="p-3">{r.sku}<span className="block text-xs">{r.batch}</span></td>
                <td className="p-3">{r.expiry}</td>
                <td className="p-3 font-semibold">{inr(r.pricePaise)}</td>
                <td className="p-3">{typeof r.costPaise === "number" ? inr(r.costPaise) : "—"}</td>
                <td className="p-3 font-bold">{r.stock}</td>
                <td className="p-3">{r.reserved}</td>
                <td className="p-3 font-bold">{r.available}</td>
                <td className="p-3">
                  <div className="flex gap-1.5">
                    <label className="sr-only" htmlFor={`d-${r.id}`}>Change by</label>
                    <input
                      id={`d-${r.id}`}
                      type="number"
                      className="input w-20"
                      placeholder="+/-"
                      value={adjust[r.id]?.delta ?? ""}
                      onChange={(e) => setAdjust({ ...adjust, [r.id]: { delta: e.target.value, reason: adjust[r.id]?.reason ?? "" } })}
                    />
                    <label className="sr-only" htmlFor={`r-${r.id}`}>Reason</label>
                    <input
                      id={`r-${r.id}`}
                      className="input w-32"
                      placeholder="Reason"
                      value={adjust[r.id]?.reason ?? ""}
                      onChange={(e) => setAdjust({ ...adjust, [r.id]: { delta: adjust[r.id]?.delta ?? "", reason: e.target.value } })}
                    />
                    <button className="btn-secondary" onClick={() => submitAdjust(r.id)}>{t("save")}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card mt-5" aria-label="Stock movement audit">
        <h3 className="font-bold text-leaf-900">Stock Movement History (audit)</h3>
        <ul className="mt-2 divide-y text-sm">
          {movements.map((m) => (
            <li key={m.id} className="flex justify-between py-1.5">
              <span>{m.reason}</span>
              <span className="font-bold">{m.delta > 0 ? `+${m.delta}` : m.delta}</span>
              <span className="text-neutral-500">{new Date(m.at).toLocaleString("en-IN")}</span>
            </li>
          ))}
          {movements.length === 0 && <li className="py-2 text-neutral-600">No movements recorded yet.</li>}
        </ul>
      </section>
    </div>
  );
}
