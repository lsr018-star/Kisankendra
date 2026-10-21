"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import { useLang } from "@/components/LanguageProvider";
import ShopNav from "@/components/ShopNav";

interface Plan {
  id: string;
  name: string;
  nameHi: string;
  pricePaise: number;
  periodDays: number;
  features: string[];
  featuresHi: string[];
}

interface Sub {
  id: string;
  planId: string;
  status: string;
  startsAt: string;
  expiresAt: string;
}

interface Bill {
  id: string;
  description: string;
  amountPaise: number;
  method: string;
  status: string;
  reference?: string;
  createdAt: string;
}

export default function ShopSubscriptionPage() {
  const { lang, t } = useLang();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<Sub | null>(null);
  const [billing, setBilling] = useState<Bill[]>([]);
  const [upiId, setUpiId] = useState("");
  const [msg, setMsg] = useState("");
  const [payRef, setPayRef] = useState<Record<string, string>>({});

  const load = () =>
    api<{ plans: Plan[]; current: Sub | null; billing: Bill[]; upiId: string }>("/api/shop/subscription")
      .then((r) => {
        setPlans(r.plans);
        setCurrent(r.current);
        setBilling(r.billing);
        setUpiId(r.upiId);
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Could not load subscription"));

  useEffect(() => {
    load();
  }, []);

  const currentPlan = plans.find((p) => p.id === current?.planId) ??
    // plan may have been deactivated after subscribing; fall back to any match-less label
    undefined;

  const doSubscribe = async (planId: string) => {
    setMsg("");
    try {
      await api("/api/shop/subscription", { method: "POST", body: JSON.stringify({ planId }) });
      setMsg(lang === "hi" ? "योजना शुरू हो गई है। भुगतान बकाया हो तो नीचे संदर्भ दर्ज करें।" : "Plan started. If a payment is due, record its reference below.");
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Subscribe failed");
    }
  };

  const doPay = async (bill: Bill) => {
    const reference = (payRef[bill.id] ?? "").trim();
    if (!reference) {
      setMsg(t("upiReference"));
      return;
    }
    setMsg("");
    try {
      await api("/api/shop/subscription", {
        method: "POST",
        body: JSON.stringify({ action: "payBilling", billingId: bill.id, reference, method: "UPI" }),
      });
      setMsg(lang === "hi" ? "भुगतान दर्ज हो गया है — एडमिन पुष्टि के बाद 'Paid' दिखेगा।" : "Payment recorded — it will show Paid after admin confirmation.");
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Payment recording failed");
    }
  };

  const statusChip = (s: string) => (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s === "Active" || s === "Paid" ? "bg-leaf-100 text-leaf-800" : s === "Grace" || s === "Confirmed" ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-800"}`}>{s}</span>
  );

  return (
    <div>
      <ShopNav />
      <h2 className="text-lg font-bold text-leaf-900">{t("subscriptions")}</h2>
      {msg && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-amber-900" role="status">{msg}</p>}

      <section className="card mt-3" aria-label={t("currentPlan")}>
        <h3 className="font-bold text-leaf-900">{t("currentPlan")}</h3>
        {current ? (
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <strong>{lang === "hi" ? currentPlan?.nameHi ?? current.planId : currentPlan?.name ?? current.planId}</strong>
            {statusChip(current.status)}
            <span>{t("expiryDate")}: {current.expiresAt.slice(0, 10)}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-neutral-600">{t("choosePlan")}</p>
        )}
        <p className="mt-2 text-sm text-neutral-600">{t("gatewayNote")} {upiId && <>UPI: <strong>{upiId}</strong></>}</p>
      </section>

      <section className="mt-4" aria-label={t("plans")}>
        <h3 className="font-bold text-leaf-900">{t("renewPlan")}</h3>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className="card flex flex-col">
              <p className="text-lg font-extrabold text-leaf-900">{lang === "hi" ? p.nameHi : p.name}</p>
              <p className="text-2xl font-extrabold text-leaf-700">{p.pricePaise === 0 ? t("free") : inr(p.pricePaise)} <span className="text-sm font-semibold text-neutral-500">/ {p.periodDays} {t("perDays")}</span></p>
              <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">
                {(lang === "hi" ? p.featuresHi : p.features).map((f) => <li key={f}>{f}</li>)}
              </ul>
              <button className="btn-primary mt-3 min-h-[48px]" onClick={() => doSubscribe(p.id)}>{t("subscribe")}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-4" aria-label={t("planHistory")}>
        <h3 className="font-bold text-leaf-900">{t("planHistory")}</h3>
        <ul className="mt-2 divide-y text-sm">
          {billing.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-2 py-2">
              <span className="font-semibold">{b.description}</span>
              <span>{inr(b.amountPaise)}</span>
              <span className="text-neutral-500">{b.createdAt.slice(0, 10)} · {b.method}</span>
              {statusChip(b.status)}
              {b.status === "Pending" && (
                <span className="flex flex-wrap items-center gap-1.5">
                  <label className="sr-only" htmlFor={`ref-${b.id}`}>{t("upiReference")}</label>
                  <input id={`ref-${b.id}`} className="input w-44" placeholder={t("upiReference")}
                    value={payRef[b.id] ?? ""} onChange={(e) => setPayRef({ ...payRef, [b.id]: e.target.value })} />
                  <button className="btn-secondary min-h-[44px]" onClick={() => doPay(b)}>{t("payNow")}</button>
                </span>
              )}
              {b.reference && <span className="text-xs text-neutral-500">{t("reference")}: {b.reference}</span>}
            </li>
          ))}
          {billing.length === 0 && <li className="py-2 text-neutral-600">{t("noData")}</li>}
        </ul>
      </section>
    </div>
  );
}
