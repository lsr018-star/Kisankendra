"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import { useLang } from "@/components/LanguageProvider";
import ShopNav from "@/components/ShopNav";

interface DashData {
  stats: {
    totalCustomers: number;
    ordersToday: number;
    ordersThisMonth: number;
    salesRecordedPaise: number;
    pendingOrders: number;
    lowStockCount: number;
    nearExpiryCount: number;
    expiredCount: number;
  };
  lowStock: { inventoryId: string; productName: string; packSize: string; stock: number; reserved: number; available: number }[];
  expiryAlerts: { inventoryId: string; productName: string; packSize: string; batch: string; expiry: string; daysToExpiry: number; expired: boolean; stock: number }[];
  recentOrders: { id: string; orderNo: string; customerName: string; totalPaise: number; status: string; source: string; createdAt: string }[];
  notifications: { id: string; text: string; at: string }[];
}

export default function ShopDashboard() {
  const { t } = useLang();
  const [data, setData] = useState<DashData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<DashData>("/api/shop/dashboard")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load dashboard"));
  }, []);

  return (
    <div>
      <ShopNav />
      {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
      {!data && !error && <p>Loading…</p>}
      {data && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {[
              { label: t("totalCustomers"), value: String(data.stats.totalCustomers) },
              { label: t("ordersToday"), value: String(data.stats.ordersToday) },
              { label: t("ordersThisMonth"), value: String(data.stats.ordersThisMonth) },
              { label: t("salesRecorded"), value: inr(data.stats.salesRecordedPaise) },
              { label: t("pendingOrders"), value: String(data.stats.pendingOrders) },
              { label: t("lowStock"), value: String(data.stats.lowStockCount) },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-leaf-700">{s.value}</p>
                <p className="text-sm text-neutral-600">{s.label}</p>
              </div>
            ))}
          </div>

          <section className="card" aria-label="Expiry alerts">
            <h2 className="font-bold text-leaf-900">{t("alerts")} — {t("expiryDate")}</h2>
            {data.expiryAlerts.length === 0 && <p className="mt-1 text-neutral-600">No batches are expired or near expiry.</p>}
            <ul className="mt-2 divide-y">
              {data.expiryAlerts.map((a) => (
                <li key={a.inventoryId} className="flex flex-wrap items-center gap-2 py-2">
                  <span>{a.productName} ({a.packSize}) · {t("batch")} {a.batch}</span>
                  <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold ${a.expired ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>
                    {a.expired ? t("expired") : `${t("nearExpiry")} · ${a.daysToExpiry}d`}
                  </span>
                  <span className="text-sm text-neutral-600">{a.expiry}</span>
                </li>
              ))}
            </ul>
            <Link href="/shop/inventory" className="btn-secondary mt-3">{t("batches")}</Link>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card" aria-label="Low stock">
              <h2 className="font-bold text-leaf-900">{t("lowStock")}</h2>
              {data.lowStock.length === 0 && <p className="mt-1 text-neutral-600">No low-stock products.</p>}
              <ul className="mt-2 divide-y">
                {data.lowStock.map((l) => (
                  <li key={l.inventoryId} className="flex justify-between py-2">
                    <span>{l.productName} ({l.packSize})</span>
                    <span className="font-bold text-red-700">{l.available} available</span>
                  </li>
                ))}
              </ul>
              <Link href="/shop/inventory" className="btn-secondary mt-3">{t("inventory")}</Link>
            </section>

            <section className="card" aria-label="Recent orders">
              <h2 className="font-bold text-leaf-900">{t("recentActivity")}</h2>
              <ul className="mt-2 divide-y">
                {data.recentOrders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-2 py-2">
                    <Link href="/shop/orders" className="font-bold text-leaf-800 underline">{o.orderNo}</Link>
                    <span className="text-sm">{o.customerName}</span>
                    <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-semibold">{o.source === "manual" ? "Manual (shop)" : "Platform"}</span>
                    <span className="ml-auto font-bold">{inr(o.totalPaise)}</span>
                    <span className="text-sm text-neutral-600">{o.status}</span>
                  </li>
                ))}
                {data.recentOrders.length === 0 && <li className="py-2 text-neutral-600">No orders yet.</li>}
              </ul>
              {data.notifications.length > 0 && (
                <>
                  <h3 className="mt-4 font-bold text-leaf-900">Notifications</h3>
                  <ul className="mt-1 space-y-1 text-sm">
                    {data.notifications.map((n) => (
                      <li key={n.id} className="rounded bg-cream p-2">{n.text}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
