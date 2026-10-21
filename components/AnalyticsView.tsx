"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import { useLang } from "@/components/LanguageProvider";
import { BarList, ColumnChart } from "@/components/Charts";

interface AnalyticsData {
  revenueTrend: { day: string; revenuePaise: number; orders: number }[];
  topProducts: { productId: string; productName: string; qty: number; revenuePaise: number }[];
  topVillages: { village: string; orders: number; revenuePaise: number }[];
  repeat: { customers: number; repeatCustomers: number; ratePct: number };
  funnel: { stage: string; count: number }[];
  totals: { orders: number; delivered: number; revenuePaise: number };
}

// Shared analytics view for shop (own data) and admin (all shops or one).
export default function AnalyticsView({ base, admin = false }: { base: string; admin?: boolean }) {
  const { t } = useLang();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [shopId, setShopId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const url = admin && shopId ? `${base}?shopId=${shopId}` : base;
    api<{ analytics: AnalyticsData; shops?: { id: string; name: string }[] }>(url)
      .then((r) => {
        setData(r.analytics);
        if (r.shops) setShops(r.shops);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load analytics"));
  }, [base, admin, shopId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>;
  if (!data) return <p>Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      {admin && (
        <label className="text-sm font-semibold">{t("shops")}
          <select className="input mt-1 max-w-xs" value={shopId} onChange={(e) => setShopId(e.target.value)}>
            <option value="">All shops</option>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: t("ordersCount"), value: String(data.totals.orders) },
          { label: "Delivered", value: String(data.totals.delivered) },
          { label: t("grossSales"), value: inr(data.totals.revenuePaise) },
          { label: t("repeatRate"), value: `${data.repeat.ratePct}% (${data.repeat.repeatCustomers}/${data.repeat.customers})` },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className="text-2xl font-extrabold text-leaf-700">{s.value}</p>
            <p className="text-sm text-neutral-600">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="card" aria-label={t("revenueTrend")}>
        <h3 className="font-bold text-leaf-900">{t("revenueTrend")}</h3>
        <ColumnChart
          ariaLabel={t("revenueTrend")}
          data={data.revenueTrend.map((d) => ({ label: d.day, value: d.revenuePaise }))}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card" aria-label={t("topProducts")}>
          <h3 className="font-bold text-leaf-900">{t("topProducts")}</h3>
          <div className="mt-2">
            <BarList
              rows={data.topProducts.map((p) => ({ label: p.productName, value: p.revenuePaise, sub: `×${p.qty}` }))}
              formatValue={(v) => inr(v)}
            />
          </div>
        </section>
        <section className="card" aria-label={t("topVillages")}>
          <h3 className="font-bold text-leaf-900">{t("topVillages")}</h3>
          <div className="mt-2">
            <BarList
              rows={data.topVillages.map((v) => ({ label: v.village, value: v.orders, sub: inr(v.revenuePaise) }))}
              formatValue={(v) => `${v}`}
            />
          </div>
        </section>
      </div>

      <section className="card" aria-label={t("orderFunnel")}>
        <h3 className="font-bold text-leaf-900">{t("orderFunnel")}</h3>
        <div className="mt-2">
          <BarList rows={data.funnel.map((f) => ({ label: f.stage, value: f.count }))} formatValue={(v) => `${v}`} />
        </div>
      </section>
    </div>
  );
}
