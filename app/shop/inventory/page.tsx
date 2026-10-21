"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import { useLang } from "@/components/LanguageProvider";
import ShopNav from "@/components/ShopNav";

interface InvRow {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  packSize: string;
  sku: string;
  batch: string;
  expiry: string;
  expired: boolean;
  nearExpiry: boolean;
  daysToExpiry: number;
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

interface CatalogueProduct {
  id: string;
  name: string;
  brand: string;
  sku: string;
  packSizes: { size: string; pricePaise: number }[];
}

interface Alerts {
  lowStock: number;
  nearExpiry: number;
  expired: number;
}

export default function ShopInventoryPage() {
  const { t } = useLang();
  const [rows, setRows] = useState<InvRow[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<CatalogueProduct[]>([]);
  const [alerts, setAlerts] = useState<Alerts | null>(null);
  const [msg, setMsg] = useState("");
  const [adjust, setAdjust] = useState<Record<string, { delta: string; reason: string }>>({});
  const [edit, setEdit] = useState<Record<string, { batch: string; expiry: string; cost: string; price: string }>>({});
  const [form, setForm] = useState({ productId: "", packSize: "", batch: "", expiry: "", stock: "", cost: "", price: "" });

  const load = () =>
    api<{ inventory: InvRow[]; movements: Movement[]; alerts: Alerts; products: CatalogueProduct[] }>("/api/shop/inventory")
      .then((r) => {
        setRows(r.inventory);
        setMovements(r.movements);
        setAlerts(r.alerts);
        setProducts(r.products);
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Could not load inventory"));

  useEffect(() => {
    load();
  }, []);

  const selectedProduct = products.find((p) => p.id === form.productId);

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

  const submitEdit = async (id: string) => {
    const e2 = edit[id];
    if (!e2) return;
    setMsg("");
    try {
      await api("/api/shop/inventory", {
        method: "POST",
        body: JSON.stringify({
          action: "update",
          inventoryId: id,
          batch: e2.batch,
          expiry: e2.expiry,
          costPaise: e2.cost === "" ? undefined : Math.round(Number(e2.cost) * 100),
          pricePaise: e2.price === "" ? undefined : Math.round(Number(e2.price) * 100),
        }),
      });
      setMsg("Batch updated.");
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Update failed");
    }
  };

  const submitCreate = async () => {
    setMsg("");
    try {
      await api("/api/shop/inventory", {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          productId: form.productId,
          packSize: form.packSize,
          batch: form.batch,
          expiry: form.expiry,
          stock: Number(form.stock || 0),
          costPaise: Math.round(Number(form.cost || 0) * 100),
          pricePaise: form.price === "" ? undefined : Math.round(Number(form.price) * 100),
        }),
      });
      setMsg("New batch added. It is now counted in your saleable stock (earliest expiry sells first).");
      setForm({ productId: "", packSize: "", batch: "", expiry: "", stock: "", cost: "", price: "" });
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not add batch");
    }
  };

  return (
    <div>
      <ShopNav />
      <h2 className="text-lg font-bold text-leaf-900">{t("inventory")} — {t("batches")}</h2>
      <p className="text-sm text-neutral-600">Each row is one batch of a product pack. Sales and order reservations always use the earliest-expiry batch first (FEFO). Purchase cost is confidential: visible only to the shop owner and authorised finance roles of this shop.</p>
      {msg && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-amber-900" role="status">{msg}</p>}

      {alerts && (alerts.lowStock > 0 || alerts.nearExpiry > 0 || alerts.expired > 0) && (
        <div className="mt-3 flex flex-wrap gap-2" role="status" aria-label={t("alerts")}>
          {alerts.lowStock > 0 && <span className="rounded-full bg-red-100 px-3 py-1.5 text-sm font-bold text-red-800">{t("lowStock")}: {alerts.lowStock}</span>}
          {alerts.nearExpiry > 0 && <span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-900">{t("nearExpiry")}: {alerts.nearExpiry}</span>}
          {alerts.expired > 0 && <span className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-bold text-white">{t("expired")}: {alerts.expired}</span>}
        </div>
      )}

      <section className="card mt-4" aria-label={t("addBatch")}>
        <h3 className="font-bold text-leaf-900">{t("addBatch")}</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <label className="text-sm font-semibold">{t("product")}
            <select className="input mt-1" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value, packSize: "" })}>
              <option value="">—</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">{t("packSize")}
            <select className="input mt-1" value={form.packSize} onChange={(e) => setForm({ ...form, packSize: e.target.value })}>
              <option value="">—</option>
              {(selectedProduct?.packSizes ?? []).map((pk) => <option key={pk.size} value={pk.size}>{pk.size} — {inr(pk.pricePaise)}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">{t("batchNo")}
            <input className="input mt-1" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="e.g. B-2301" />
          </label>
          <label className="text-sm font-semibold">{t("expiryDate")}
            <input type="date" className="input mt-1" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} />
          </label>
          <label className="text-sm font-semibold">{t("stockQty")}
            <input type="number" min="0" className="input mt-1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </label>
          <label className="text-sm font-semibold">{t("costPrice")} (₹)
            <input type="number" min="0" step="0.01" className="input mt-1" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </label>
        </div>
        <button className="btn-primary mt-3 min-h-[48px]" onClick={submitCreate}>{t("addBatch")}</button>
      </section>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white ring-1 ring-leaf-100">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-leaf-50">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">SKU / {t("batch")}</th>
              <th className="p-3">{t("expiryDate")}</th>
              <th className="p-3">{t("sellPrice")}</th>
              <th className="p-3">{t("costPrice")}</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Reserved</th>
              <th className="p-3">Available</th>
              <th className="p-3">{t("editBatch")} / Adjust</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t align-top ${r.expired ? "bg-red-50" : r.lowStock ? "bg-amber-50" : ""}`}>
                <td className="p-3">
                  <span className="font-semibold">{r.productName}</span>
                  <span className="block text-xs text-neutral-500">{r.brand} · {r.packSize}</span>
                  {r.lowStock && <span className="text-xs font-bold text-red-700">{t("lowStock")}</span>}
                </td>
                <td className="p-3">{r.sku}<span className="block text-xs">{r.batch}</span></td>
                <td className="p-3">
                  {r.expiry}
                  {r.expired
                    ? <span className="block text-xs font-bold text-red-700">{t("expired")}</span>
                    : r.nearExpiry
                      ? <span className="block text-xs font-bold text-amber-700">{t("nearExpiry")} ({r.daysToExpiry}d)</span>
                      : null}
                </td>
                <td className="p-3 font-semibold">{inr(r.pricePaise)}</td>
                <td className="p-3">{typeof r.costPaise === "number" ? inr(r.costPaise) : "—"}</td>
                <td className="p-3 font-bold">{r.stock}</td>
                <td className="p-3">{r.reserved}</td>
                <td className="p-3 font-bold">{r.available}</td>
                <td className="p-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                      <label className="sr-only" htmlFor={`d-${r.id}`}>Change by</label>
                      <input id={`d-${r.id}`} type="number" className="input w-20" placeholder="+/-"
                        value={adjust[r.id]?.delta ?? ""}
                        onChange={(e) => setAdjust({ ...adjust, [r.id]: { delta: e.target.value, reason: adjust[r.id]?.reason ?? "" } })} />
                      <label className="sr-only" htmlFor={`r-${r.id}`}>{t("reason")}</label>
                      <input id={`r-${r.id}`} className="input w-28" placeholder={t("reason")}
                        value={adjust[r.id]?.reason ?? ""}
                        onChange={(e) => setAdjust({ ...adjust, [r.id]: { delta: adjust[r.id]?.delta ?? "", reason: e.target.value } })} />
                      <button className="btn-secondary" onClick={() => submitAdjust(r.id)}>{t("save")}</button>
                    </div>
                    <details>
                      <summary className="cursor-pointer text-xs font-semibold text-leaf-800 underline">{t("editBatch")}</summary>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <input className="input w-24" aria-label={t("batchNo")} placeholder={t("batchNo")}
                          value={edit[r.id]?.batch ?? r.batch}
                          onChange={(e) => setEdit({ ...edit, [r.id]: { batch: e.target.value, expiry: edit[r.id]?.expiry ?? r.expiry, cost: edit[r.id]?.cost ?? "", price: edit[r.id]?.price ?? "" } })} />
                        <input type="date" className="input w-36" aria-label={t("expiryDate")}
                          value={edit[r.id]?.expiry ?? r.expiry}
                          onChange={(e) => setEdit({ ...edit, [r.id]: { batch: edit[r.id]?.batch ?? r.batch, expiry: e.target.value, cost: edit[r.id]?.cost ?? "", price: edit[r.id]?.price ?? "" } })} />
                        <input className="input w-24" aria-label={t("costPrice")} placeholder={`${t("costPrice")} ₹`} type="number" min="0" step="0.01"
                          value={edit[r.id]?.cost ?? ""}
                          onChange={(e) => setEdit({ ...edit, [r.id]: { batch: edit[r.id]?.batch ?? r.batch, expiry: edit[r.id]?.expiry ?? r.expiry, cost: e.target.value, price: edit[r.id]?.price ?? "" } })} />
                        <button className="btn-secondary" onClick={() => submitEdit(r.id)}>{t("save")}</button>
                      </div>
                    </details>
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
