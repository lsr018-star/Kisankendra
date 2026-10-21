"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, fetchMe } from "@/lib/client";
import { inr } from "@/lib/money";
import { useLang } from "@/components/LanguageProvider";
import ShopNav from "@/components/ShopNav";

interface ShopInfo {
  name: string;
  status: string;
  licencesVerified: boolean;
  licences: { pesticideNo: string; pesticideExpiry: string; fertilizerNo: string; fertilizerExpiry: string };
  villages: string[];
  deliveryCapable: boolean;
}

interface InvData {
  inventory: { id: string; stock: number }[];
  products: { id: string; name: string; brand: string; packSizes: { size: string; pricePaise: number }[] }[];
}

// New-shop onboarding: a guided checklist that takes a registered shop from
// Pending to actually winning order assignments — approval, licence
// verification, service villages, and first stock (the step Phase 1 lacked).
export default function ShopOnboardingPage() {
  const { t } = useLang();
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [inv, setInv] = useState<InvData | null>(null);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ productId: "", packSize: "", batch: "", expiry: "", stock: "", cost: "" });

  const load = () => {
    fetchMe().then((r) => setShop((r?.shop as unknown as ShopInfo | undefined) ?? null));
    api<InvData>("/api/shop/inventory").then(setInv).catch(() => {});
  };
  useEffect(load, []);

  const stockedProducts = inv ? new Set(inv.inventory.filter((i) => i.stock > 0).map((i) => i.id)).size : 0;
  const stockedLines = inv ? inv.inventory.filter((i) => i.stock > 0).length : 0;
  const approved = shop?.status === "Approved";
  const verified = shop?.licencesVerified ?? false;
  const hasStock = stockedLines > 0;
  const canWin = approved && verified && hasStock;
  const selectedProduct = inv?.products.find((p) => p.id === form.productId);

  const submitFirstStock = async () => {
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
        }),
      });
      setMsg("Stock added. Repeat for each product you keep, or manage everything later from the Inventory page.");
      setForm({ productId: "", packSize: "", batch: "", expiry: "", stock: "", cost: "" });
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not add stock");
    }
  };

  const Step = ({ done, title, children }: { done: boolean; title: string; children: React.ReactNode }) => (
    <section className={`card ${done ? "" : "ring-2 ring-amber-300"}`} aria-label={title}>
      <h3 className="flex items-center gap-2 font-bold text-leaf-900">
        <span aria-hidden className={`flex h-7 w-7 items-center justify-center rounded-full text-white ${done ? "bg-leaf-600" : "bg-amber-500"}`}>{done ? "✓" : "!"}</span>
        {title}
      </h3>
      <div className="mt-2 text-sm text-neutral-700">{children}</div>
    </section>
  );

  return (
    <div>
      <ShopNav />
      <h2 className="text-lg font-bold text-leaf-900">{t("onboarding")} — {t("stockYourShop")}</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Orders are assigned automatically to shops that are <strong>Approved</strong>, have <strong>verified licences</strong> and hold <strong>stock</strong> for the farmer&apos;s village. Complete all three steps to start receiving orders.
      </p>
      {msg && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-amber-900" role="status">{msg}</p>}

      <div className="mt-4 flex flex-col gap-4">
        <Step done={approved} title={`1. Shop approval — ${shop?.status ?? "…"}`}>
          {approved
            ? <p>Your shop is approved by the Kisankendra admin team.</p>
            : <p>Your shop is currently <strong>{shop?.status}</strong>. The admin team reviews your registration and licence documents. You can already add stock below so you are ready the moment approval lands.</p>}
        </Step>

        <Step done={verified} title="2. Licence verification">
          {shop ? (
            <ul className="list-disc pl-5">
              <li>Pesticide licence {shop.licences.pesticideNo} (valid till {shop.licences.pesticideExpiry})</li>
              <li>Fertilizer licence {shop.licences.fertilizerNo} (valid till {shop.licences.fertilizerExpiry})</li>
              <li>{verified ? "Both licences are verified." : "Verification is done by the admin team after checking your documents."}</li>
            </ul>
          ) : <p>Loading…</p>}
        </Step>

        <Step done={hasStock} title={`3. ${t("stockYourShop")} (${stockedLines} batches stocked)`}>
          <p className="mb-2">Serving villages: {shop?.villages.join(", ") ?? "…"}. Add the products you physically keep, one batch at a time:</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="text-sm font-semibold">{t("product")}
              <select className="input mt-1" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value, packSize: "" })}>
                <option value="">—</option>
                {(inv?.products ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">{t("packSize")}
              <select className="input mt-1" value={form.packSize} onChange={(e) => setForm({ ...form, packSize: e.target.value })}>
                <option value="">—</option>
                {(selectedProduct?.packSizes ?? []).map((pk) => <option key={pk.size} value={pk.size}>{pk.size} — {inr(pk.pricePaise)}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">{t("batchNo")}
              <input className="input mt-1" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="e.g. C-1001" />
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
          <button className="btn-primary mt-3 min-h-[48px]" onClick={submitFirstStock}>{t("addBatch")}</button>
          <p className="mt-2">Full batch management lives on the <Link href="/shop/inventory" className="font-semibold underline">{t("inventory")}</Link> page. {stockedProducts > 0 ? "" : ""}</p>
        </Step>

        <section className={`card ${canWin ? "bg-leaf-50" : ""}`} aria-label="Ready status">
          <h3 className="font-bold text-leaf-900">{canWin ? "You are ready to receive orders" : "Not ready yet"}</h3>
          <p className="mt-1 text-sm text-neutral-700">
            {canWin
              ? "Your shop now appears in automatic order assignment for your villages whenever you hold full stock for an order."
              : "Complete the steps above. Approval and licence verification are admin actions; stocking is yours — once all three are done, assignments start automatically."}
          </p>
        </section>
      </div>
    </div>
  );
}
