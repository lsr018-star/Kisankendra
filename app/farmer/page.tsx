"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, fetchMe, type SessionUser } from "@/lib/client";
import { inr } from "@/lib/money";
import { statusLabel } from "@/lib/i18n";
import { useLang } from "@/components/LanguageProvider";

interface OrderRow {
  id: string;
  orderNo: string;
  status: string;
  totalPaise: number;
  createdAt: string;
  items: { productName: string; qty: number }[];
}

export default function FarmerDashboard() {
  const { lang, t } = useLang();
  const [me, setMe] = useState<SessionUser | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe().then((r) => setMe(r?.user ?? null));
    api<{ orders: OrderRow[] }>("/api/orders")
      .then((r) => setOrders(r.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const open = orders.filter((o) => !["Delivered", "Cancelled", "Returned"].includes(o.status));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-leaf-900">
        {t("myDashboard")}
        {me ? ` — ${me.name}` : ""}
      </h1>

      {/* Big three actions for farmers: large tap targets, one tap each. */}
      <nav className="grid gap-3 sm:grid-cols-3" aria-label="Quick actions">
        <Link href="/farmer/orders" className="btn-farmer bg-leaf-600 text-white hover:bg-leaf-700">
          <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /><path d="M20 3v5h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {t("orderAgain")}
        </Link>
        <Link href={open[0] ? `/farmer/orders/${open[0].id}` : "/farmer/orders"} className="btn-farmer bg-tang-500 text-white hover:bg-tang-600">
          <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" fill="none" stroke="currentColor" strokeWidth="2.2" /><circle cx="12" cy="10" r="2.6" fill="currentColor" /></svg>
          {t("trackOrder")}
        </Link>
        <Link href="/farmer/support" className="btn-farmer bg-white text-leaf-800 ring-2 ring-leaf-600 hover:bg-leaf-50">
          <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true"><path d="M12 20 C6 16 5 8 12 3 C19 8 18 16 12 20 Z" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="M12 17 C12 12 13 9 16 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          {t("helpForCrop")}
        </Link>
      </nav>
      <div className="grid gap-3 sm:grid-cols-4">
        <Link href="/farmer/orders" className="card text-center hover:ring-leaf-400">
          <p className="text-3xl font-extrabold text-leaf-700">{orders.length}</p>
          <p className="text-sm">{t("myOrders")}</p>
        </Link>
        <Link href="/farmer/orders" className="card text-center hover:ring-leaf-400">
          <p className="text-3xl font-extrabold text-tang-500">{open.length}</p>
          <p className="text-sm">Current Orders</p>
        </Link>
        <Link href="/farmer/profile" className="card text-center hover:ring-leaf-400">
          <p className="text-3xl font-extrabold text-leaf-700">{t("profile")}</p>
          <p className="text-sm">{t("addresses")} & {t("language")}</p>
        </Link>
        <Link href="/farmer/support" className="card text-center hover:ring-leaf-400">
          <p className="text-3xl font-extrabold text-leaf-700">{t("solutionBox")}</p>
          <p className="text-sm">{t("support")}</p>
        </Link>
      </div>

      <section className="card" aria-label="Current orders">
        <h2 className="font-bold text-leaf-900">Current Orders</h2>
        {loading && <p>Loading…</p>}
        {!loading && open.length === 0 && <p className="mt-2 text-neutral-600">No current orders. <Link href="/catalogue" className="underline font-semibold">{t("viewProducts")}</Link></p>}
        <ul className="mt-2 divide-y">
          {open.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-2 py-2.5">
              <Link href={`/farmer/orders/${o.id}`} className="font-bold text-leaf-800 underline">{o.orderNo}</Link>
              <span className="text-sm text-neutral-600">{o.items.map((i) => `${i.productName} ×${i.qty}`).join(", ")}</span>
              <span className="ml-auto rounded-full bg-leaf-100 px-2.5 py-0.5 text-xs font-bold text-leaf-800">{statusLabel(lang, o.status)}</span>
              <span className="font-bold">{inr(o.totalPaise)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
