"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import { useLang } from "@/components/LanguageProvider";
import AdminNav from "@/components/AdminNav";

interface Plan {
  id: string;
  name: string;
  nameHi: string;
  pricePaise: number;
  periodDays: number;
  features: string[];
  featuresHi: string[];
  active: boolean;
}

interface SubRow {
  id: string;
  shopId: string;
  shopName: string;
  planName: string;
  status: string;
  startsAt: string;
  expiresAt: string;
}

interface BillRow {
  id: string;
  shopName: string;
  description: string;
  amountPaise: number;
  method: string;
  status: string;
  reference?: string;
  createdAt: string;
}

export default function AdminPlansPage() {
  const { t } = useLang();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [billing, setBilling] = useState<BillRow[]>([]);
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ name: "", nameHi: "", price: "", periodDays: "30", features: "" });
  const [assign, setAssign] = useState({ shopId: "", planId: "" });

  const load = () =>
    api<{ plans: Plan[]; subscriptions: SubRow[]; billing: BillRow[]; shops: { id: string; name: string }[] }>("/api/admin/plans")
      .then((r) => {
        setPlans(r.plans);
        setSubs(r.subscriptions);
        setBilling(r.billing);
        setShops(r.shops);
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Could not load plans"));

  useEffect(() => {
    load();
  }, []);

  const post = async (body: Record<string, unknown>, okMsg: string) => {
    setMsg("");
    try {
      await api("/api/admin/plans", { method: "POST", body: JSON.stringify(body) });
      setMsg(okMsg);
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Action failed");
    }
  };

  return (
    <div>
      <AdminNav />
      <h2 className="text-lg font-bold text-leaf-900">{t("plans")} & {t("subscriptions")}</h2>
      {msg && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-amber-900" role="status">{msg}</p>}

      <section className="card mt-3" aria-label="Create plan">
        <h3 className="font-bold text-leaf-900">Create Plan</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <label className="text-sm font-semibold">Name (EN)
            <input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="text-sm font-semibold">Name (HI)
            <input className="input mt-1" value={form.nameHi} onChange={(e) => setForm({ ...form, nameHi: e.target.value })} />
          </label>
          <label className="text-sm font-semibold">{t("price")} (₹)
            <input type="number" min="0" step="0.01" className="input mt-1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </label>
          <label className="text-sm font-semibold">Period ({t("perDays")})
            <input type="number" min="1" className="input mt-1" value={form.periodDays} onChange={(e) => setForm({ ...form, periodDays: e.target.value })} />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">Features (one per line, EN)
            <textarea className="input mt-1" rows={2} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
          </label>
        </div>
        <button className="btn-primary mt-3 min-h-[48px]" onClick={() => post({
          action: "createPlan",
          name: form.name,
          nameHi: form.nameHi || form.name,
          pricePaise: Math.round(Number(form.price || 0) * 100),
          periodDays: Number(form.periodDays || 30),
          features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
          featuresHi: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
        }, "Plan created.")}>{t("save")}</button>
      </section>

      <section className="card mt-4" aria-label="Plan catalogue">
        <h3 className="font-bold text-leaf-900">{t("plans")}</h3>
        <ul className="mt-2 divide-y text-sm">
          {plans.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 py-2">
              <strong>{p.name}</strong>
              <span>{p.pricePaise === 0 ? t("free") : inr(p.pricePaise)} / {p.periodDays} {t("perDays")}</span>
              <span className="text-neutral-500">{p.features.join(" · ")}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.active ? "bg-leaf-100 text-leaf-800" : "bg-red-100 text-red-800"}`}>{p.active ? t("active") : "Off"}</span>
              <button className="btn-secondary" onClick={() => post({ action: "togglePlan", planId: p.id }, "Plan updated.")}>{p.active ? "Deactivate" : "Activate"}</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-4" aria-label="Assign plan">
        <h3 className="font-bold text-leaf-900">Assign Plan to Shop</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <select className="input" aria-label={t("shops")} value={assign.shopId} onChange={(e) => setAssign({ ...assign, shopId: e.target.value })}>
            <option value="">— Shop —</option>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input" aria-label={t("plans")} value={assign.planId} onChange={(e) => setAssign({ ...assign, planId: e.target.value })}>
            <option value="">— Plan —</option>
            {plans.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="btn-primary min-h-[48px]" onClick={() => post({ action: "assignPlan", shopId: assign.shopId, planId: assign.planId }, "Plan assigned.")}>{t("subscribe")}</button>
        </div>
      </section>

      <section className="card mt-4" aria-label="Subscriptions">
        <h3 className="font-bold text-leaf-900">{t("subscriptions")}</h3>
        <ul className="mt-2 divide-y text-sm">
          {subs.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 py-2">
              <strong>{s.shopName}</strong>
              <span>{s.planName}</span>
              <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-bold">{s.status}</span>
              <span className="text-neutral-500">{s.startsAt.slice(0, 10)} → {s.expiresAt.slice(0, 10)}</span>
              {s.status !== "Cancelled" && (
                <button className="btn-secondary" onClick={() => post({ action: "cancelSubscription", subscriptionId: s.id }, "Subscription cancelled.")}>{t("cancel")}</button>
              )}
            </li>
          ))}
          {subs.length === 0 && <li className="py-2 text-neutral-600">{t("noData")}</li>}
        </ul>
      </section>

      <section className="card mt-4" aria-label="Billing">
        <h3 className="font-bold text-leaf-900">{t("planHistory")}</h3>
        <ul className="mt-2 divide-y text-sm">
          {billing.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-2 py-2">
              <strong>{b.shopName}</strong>
              <span>{b.description}</span>
              <span>{inr(b.amountPaise)}</span>
              <span className="text-neutral-500">{b.method}{b.reference ? ` · ${b.reference}` : ""}</span>
              <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-bold">{b.status}</span>
              {(b.status === "Pending" || b.status === "Confirmed") && (
                <button className="btn-primary min-h-[44px]" onClick={() => post({ action: "confirmBilling", billingId: b.id }, "Payment confirmed as Paid.")}>{t("confirmPayment")}</button>
              )}
            </li>
          ))}
          {billing.length === 0 && <li className="py-2 text-neutral-600">{t("noData")}</li>}
        </ul>
      </section>
    </div>
  );
}
