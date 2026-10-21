"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import { statusLabel } from "@/lib/i18n";
import { useLang } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";

interface OrderRow {
  id: string;
  orderNo: string;
  status: string;
  totalPaise: number;
  createdAt: string;
  source: string;
  items: { productId: string; productName: string; packSize: string; qty: number; pricePaise: number }[];
}

export default function FarmerOrdersPage() {
  const { lang, t } = useLang();
  const cart = useCart();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ orders: OrderRow[] }>("/api/orders")
      .then((r) => setOrders(r.orders))
      .catch(() => {});
  }, []);

  const reorder = (o: OrderRow) => {
    for (const i of o.items) {
      cart.add(
        { productId: i.productId, productName: i.productName, packSize: i.packSize, pricePaise: i.pricePaise, tileColor: "#2E7D32", initials: "KK" },
        i.qty
      );
    }
    setMsg(`${o.orderNo} items added to your cart.`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-leaf-900">{t("myOrders")}</h1>
      {msg && <p className="mt-2 rounded-lg bg-leaf-50 p-3 text-leaf-800" role="status">{msg} <Link href="/cart" className="font-bold underline">{t("cart")}</Link></p>}
      <div className="mt-4 flex flex-col gap-3">
        {orders.length === 0 && (
          <div className="card text-center">
            <p>No orders yet.</p>
            <Link href="/catalogue" className="btn-primary mt-3">{t("viewProducts")}</Link>
          </div>
        )}
        {orders.map((o) => (
          <article key={o.id} className="card flex flex-wrap items-center gap-3">
            <div className="min-w-[200px] flex-1">
              <Link href={`/farmer/orders/${o.id}`} className="font-bold text-leaf-800 underline">{o.orderNo}</Link>
              <p className="text-sm text-neutral-600">{new Date(o.createdAt).toLocaleString("en-IN")}</p>
              <p className="text-sm">{o.items.map((i) => `${i.productName} (${i.packSize}) ×${i.qty}`).join(", ")}</p>
            </div>
            <span className="rounded-full bg-leaf-100 px-3 py-1 text-sm font-bold text-leaf-800">{statusLabel(lang, o.status)}</span>
            <span className="text-lg font-extrabold">{inr(o.totalPaise)}</span>
            <button className="btn-secondary" onClick={() => reorder(o)}>{t("reorder")}</button>
          </article>
        ))}
      </div>
    </div>
  );
}
