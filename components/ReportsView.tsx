"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import { useLang } from "@/components/LanguageProvider";

type ReportType = "sales" | "margin" | "reconciliation";

interface Props {
  base: string; // /api/shop/reports or /api/admin/reports
  admin?: boolean;
}

// Shared reports UI for shop and admin: three report types, date-range
// filter, and a CSV download that hits the same API with format=csv.
export default function ReportsView({ base, admin = false }: Props) {
  const { t } = useLang();
  const [type, setType] = useState<ReportType>("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [shopId, setShopId] = useState("");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  const query = useCallback(() => {
    const q = new URLSearchParams({ type });
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (admin && shopId) q.set("shopId", shopId);
    return q.toString();
  }, [type, from, to, admin, shopId]);

  const load = useCallback(() => {
    setError("");
    api<Record<string, unknown>>(`${base}?${query()}`)
      .then(setData)
      .catch((e) => {
        setData(null);
        setError(e instanceof Error ? e.message : "Could not load report");
      });
  }, [base, query]);

  useEffect(() => {
    load();
  }, [load]);

  const report = (data?.report ?? null) as Record<string, unknown> | null;
  const summary = (report?.summary ?? {}) as Record<string, number>;
  const shops = (data?.shops ?? []) as { id: string; name: string }[];
  const perShop = (data?.perShop ?? []) as { shopId: string; shopName: string; orders: number; grossPaise: number }[];

  const csvHref = `${base}?${query()}&format=csv`;

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("reports")}>
        {(["sales", "margin", "reconciliation"] as ReportType[]).map((rt) => (
          <button
            key={rt}
            role="tab"
            aria-selected={type === rt}
            className={`min-h-[48px] rounded-lg px-4 font-semibold ${type === rt ? "bg-leaf-600 text-white" : "bg-white text-leaf-800 ring-1 ring-leaf-200"}`}
            onClick={() => setType(rt)}
          >
            {t(rt === "sales" ? "salesReport" : rt === "margin" ? "marginReport" : "reconciliation")}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-sm font-semibold">{t("dateFrom")}
          <input type="date" className="input mt-1" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-sm font-semibold">{t("dateTo")}
          <input type="date" className="input mt-1" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        {admin && (
          <label className="text-sm font-semibold">{t("shops")}
            <select className="input mt-1" value={shopId} onChange={(e) => setShopId(e.target.value)}>
              <option value="">{t("allTime")} — All shops</option>
              {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        )}
        <button className="btn-secondary min-h-[48px]" onClick={load}>{t("apply")}</button>
        <a className="btn-primary min-h-[48px]" href={csvHref} download>{t("exportCsv")}</a>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
      {!report && !error && <p className="mt-3">Loading…</p>}

      {report && type === "sales" && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: t("ordersCount"), value: String(summary.orders ?? 0) },
              { label: t("grossSales"), value: inr(summary.grossPaise ?? 0) },
              { label: t("subtotal"), value: inr(summary.itemsPaise ?? 0) },
              { label: t("tax"), value: inr(summary.taxPaise ?? 0) },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <p className="text-2xl font-extrabold text-leaf-700">{s.value}</p>
                <p className="text-sm text-neutral-600">{s.label}</p>
              </div>
            ))}
          </div>
          {admin && perShop.length > 0 && (
            <section className="card" aria-label="Per shop">
              <h3 className="font-bold text-leaf-900">{t("shops")}</h3>
              <ul className="mt-2 divide-y text-sm">
                {perShop.map((p) => (
                  <li key={p.shopId} className="flex justify-between py-1.5">
                    <span>{p.shopName}</span>
                    <span>{p.orders} {t("ordersCount")} · <strong>{inr(p.grossPaise)}</strong></span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="card" aria-label={t("topProducts")}>
            <h3 className="font-bold text-leaf-900">{t("topProducts")}</h3>
            <ul className="mt-2 divide-y text-sm">
              {((report.byProduct ?? []) as { productId: string; productName: string; packSize: string; qty: number; amountPaise: number }[]).map((p) => (
                <li key={p.productId + p.packSize} className="flex justify-between py-1.5">
                  <span>{p.productName} ({p.packSize}) × {p.qty}</span>
                  <span className="font-bold">{inr(p.amountPaise)}</span>
                </li>
              ))}
              {(report.byProduct as unknown[])?.length === 0 && <li className="py-2 text-neutral-600">{t("noData")}</li>}
            </ul>
          </section>
        </div>
      )}

      {report && type === "margin" && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: t("ordersCount"), value: String(summary.orders ?? 0) },
              { label: t("subtotal"), value: inr(summary.itemsPaise ?? 0) },
              { label: t("commission"), value: inr(summary.commissionPaise ?? 0) },
              { label: t("totalMargin"), value: inr(summary.marginPaise ?? 0) },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <p className="text-2xl font-extrabold text-leaf-700">{s.value}</p>
                <p className="text-sm text-neutral-600">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-leaf-100">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-leaf-50"><tr><th className="p-3">Order</th><th className="p-3">{t("date")}</th><th className="p-3">{t("subtotal")}</th><th className="p-3">{t("costPrice")}</th><th className="p-3">{t("commission")}</th><th className="p-3">{t("totalMargin")}</th></tr></thead>
              <tbody>
                {((report.orders ?? []) as { id: string; orderNo: string; date: string; itemsPaise: number; supplyPaise: number; commissionPaise: number; marginPaise: number }[]).map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-3 font-semibold">{o.orderNo}</td><td className="p-3">{o.date}</td>
                    <td className="p-3">{inr(o.itemsPaise)}</td><td className="p-3">{inr(o.supplyPaise)}</td>
                    <td className="p-3">{inr(o.commissionPaise)}</td><td className="p-3 font-bold">{inr(o.marginPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {report && type === "reconciliation" && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: t("ordersCount"), value: String(summary.orders ?? 0) },
              { label: t("total"), value: inr(summary.expectedPaise ?? 0) },
              { label: t("collected"), value: inr(summary.collectedPaise ?? 0) },
              { label: t("pendingCollection"), value: inr(summary.outstandingPaise ?? 0) },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <p className="text-2xl font-extrabold text-leaf-700">{s.value}</p>
                <p className="text-sm text-neutral-600">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-leaf-100">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-leaf-50"><tr><th className="p-3">Order</th><th className="p-3">{t("date")}</th><th className="p-3">{t("status")}</th><th className="p-3">{t("total")}</th><th className="p-3">{t("collected")}</th><th className="p-3">{t("pendingCollection")}</th></tr></thead>
              <tbody>
                {((report.orders ?? []) as { id: string; orderNo: string; date: string; status: string; expectedPaise: number; collectedPaise: number; outstandingPaise: number }[]).map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-3 font-semibold">{o.orderNo}</td><td className="p-3">{o.date}</td><td className="p-3">{o.status}</td>
                    <td className="p-3">{inr(o.expectedPaise)}</td><td className="p-3">{inr(o.collectedPaise)}</td>
                    <td className="p-3 font-bold">{inr(o.outstandingPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
