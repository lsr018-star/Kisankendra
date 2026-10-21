"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import { useLang } from "@/components/LanguageProvider";
import AdminNav from "@/components/AdminNav";

interface Settlement {
  id: string;
  shopId: string;
  shopName: string;
  periodStart: string;
  periodEnd: string;
  grossPaise: number;
  commissionPaise: number;
  supplyPaise: number;
  dueToShopPaise: number;
  status: string;
  createdAt: string;
}

interface Payment {
  id: string;
  orderId?: string;
  billingId?: string;
  provider: string;
  amountPaise: number;
  status: string;
  method?: string;
  createdAt: string;
}

interface Refund {
  id: string;
  paymentId: string;
  amountPaise: number;
  status: string;
  reason: string;
  createdAt: string;
}

export default function AdminSettlementsPage() {
  const { t } = useLang();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [provider, setProvider] = useState("");
  const [msg, setMsg] = useState("");
  const [gen, setGen] = useState({ shopId: "", from: "", to: "" });

  const load = () =>
    api<{ settlements: Settlement[]; payments: Payment[]; refunds: Refund[]; shops: { id: string; name: string }[]; paymentProvider: string }>("/api/admin/settlements")
      .then((r) => {
        setSettlements(r.settlements);
        setPayments(r.payments);
        setRefunds(r.refunds);
        setShops(r.shops);
        setProvider(r.paymentProvider);
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Could not load settlements"));

  useEffect(() => {
    load();
  }, []);

  const post = async (body: Record<string, unknown>, ok: string) => {
    setMsg("");
    try {
      await api("/api/admin/settlements", { method: "POST", body: JSON.stringify(body) });
      setMsg(ok);
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Action failed");
    }
  };

  return (
    <div>
      <AdminNav />
      <h2 className="text-lg font-bold text-leaf-900">{t("settlements")} & {t("payments")}</h2>
      <p className="mt-1 text-sm text-neutral-600">Live payment provider: <strong>{provider}</strong>. {t("gatewayNote")}</p>
      {msg && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-amber-900" role="status">{msg}</p>}

      <section className="card mt-3" aria-label="Generate settlement">
        <h3 className="font-bold text-leaf-900">Generate Settlement</h3>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="text-sm font-semibold">{t("shops")}
            <select className="input mt-1" value={gen.shopId} onChange={(e) => setGen({ ...gen, shopId: e.target.value })}>
              <option value="">—</option>
              {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">{t("dateFrom")}
            <input type="date" className="input mt-1" value={gen.from} onChange={(e) => setGen({ ...gen, from: e.target.value })} />
          </label>
          <label className="text-sm font-semibold">{t("dateTo")}
            <input type="date" className="input mt-1" value={gen.to} onChange={(e) => setGen({ ...gen, to: e.target.value })} />
          </label>
          <button className="btn-primary min-h-[48px]" onClick={() => post({ action: "generate", ...gen }, "Settlement generated from delivered orders.")}>Generate</button>
        </div>
      </section>

      <section className="card mt-4" aria-label={t("settlements")}>
        <h3 className="font-bold text-leaf-900">{t("settlements")}</h3>
        <ul className="mt-2 divide-y text-sm">
          {settlements.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 py-2">
              <strong>{s.shopName}</strong>
              <span className="text-neutral-500">{s.periodStart.slice(0, 10)} → {s.periodEnd.slice(0, 10)}</span>
              <span>{t("grossSales")}: {inr(s.grossPaise)}</span>
              <span>{t("commission")}: {inr(s.commissionPaise)}</span>
              <span>{t("dueToShop")}: <strong>{inr(s.dueToShopPaise)}</strong></span>
              <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-bold">{s.status}</span>
              {s.status === "Open" && (
                <button className="btn-secondary" onClick={() => post({ action: "settle", settlementId: s.id }, "Marked settled.")}>{t("settle")}</button>
              )}
            </li>
          ))}
          {settlements.length === 0 && <li className="py-2 text-neutral-600">{t("noData")}</li>}
        </ul>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card" aria-label={t("payments")}>
          <h3 className="font-bold text-leaf-900">{t("payments")}</h3>
          <ul className="mt-2 divide-y text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-1.5">
                <span>{p.provider} · {p.method ?? "—"} · {p.createdAt.slice(0, 10)}</span>
                <span><strong>{inr(p.amountPaise)}</strong> · {p.status}</span>
              </li>
            ))}
            {payments.length === 0 && <li className="py-2 text-neutral-600">{t("noData")}</li>}
          </ul>
        </section>
        <section className="card" aria-label={t("refunds")}>
          <h3 className="font-bold text-leaf-900">{t("refunds")}</h3>
          <ul className="mt-2 divide-y text-sm">
            {refunds.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 py-1.5">
                <span>{r.reason} · {r.createdAt.slice(0, 10)}</span>
                <span><strong>{inr(r.amountPaise)}</strong> · {r.status}</span>
              </li>
            ))}
            {refunds.length === 0 && <li className="py-2 text-neutral-600">{t("noData")}</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
