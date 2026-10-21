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
