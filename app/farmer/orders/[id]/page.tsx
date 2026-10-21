"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import { statusLabel } from "@/lib/i18n";
import { useLang } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";

interface OrderDetail {
  id: string;
  orderNo: string;
  status: string;
  customerName: string;
  mobile: string;
  village: string;
  addressLine: string;
  deliveryType: string;
  paymentMethod: string;
  paymentStatus: string;
  itemsTotalPaise: number;
  deliveryFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  unassignedReason?: string;
  items: { productId: string; productName: string; packSize: string; qty: number; pricePaise: number; lineTotalPaise: number }[];
  createdAt: string;
}

interface HistoryRow {
  id: string;
  status: string;
  actorRole: string;
  note?: string;
  at: string;
}

export default function FarmerOrderTracking({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang, t } = useLang();
  const cart = useCart();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [shop, setShop] = useState<{ name: string; address: string; mobile: string } | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    api<{ order: OrderDetail; history: HistoryRow[]; shop: typeof shop }>(`/api/orders/${id}`)
      .then((r) => {
        setOrder(r.order);
        setHistory(r.history);
        setShop(r.shop);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load order"));
  };

  useEffect(load, [id]);

  if (error) return <div className="card"><p role="alert" className="text-red-800">{error}</p></div>;
  if (!order) return <p>Loading…</p>;

  const cancellable = ["Pending", "Accepted", "Processing", "Ready for Dispatch", "Unassigned"].includes(order.status);

  const cancel = async () => {
    setBusy(true);
    setMsg("");
    try {
      await api(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ action: "cancel" }) });
      setMsg("Order cancelled. Any reservation has been released.");
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not cancel");
    } finally {
      setBusy(false);
    }
  };

  const reorder = () => {
    for (const i of order.items) {
      cart.add(
        { productId: i.productId, productName: i.productName, packSize: i.packSize, pricePaise: i.pricePaise, tileColor: "#2E7D32", initials: "KK" },
        i.qty
      );
    }
    setMsg("Items added to your cart.");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-leaf-900">{order.orderNo}</h1>
        <span className="rounded-full bg-leaf-100 px-3 py-1 font-bold text-leaf-800">{statusLabel(lang, order.status)}</span>
        <span className="text-sm text-neutral-600">{new Date(order.createdAt).toLocaleString("en-IN")}</span>
      </div>
      {msg && <p className="rounded-lg bg-leaf-50 p-3 text-leaf-800" role="status">{msg} {msg.includes("cart") && <Link href="/cart" className="font-bold underline">{t("cart")}</Link>}</p>}
      {order.status === "Unassigned" && (
        <p className="rounded-lg bg-amber-50 p-3 text-amber-900" role="status">
          {order.unassignedReason ?? "No partner shop can fulfil this order right now."}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card" aria-label="Items">
          <h2 className="font-bold text-leaf-900">Items</h2>
          <ul className="mt-2 divide-y">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex justify-between py-2">
                <span>{i.productName} ({i.packSize}) ×{i.qty}</span>
                <span className="font-semibold">{inr(i.lineTotalPaise)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t pt-3">
            <div className="flex justify-between"><dt>{t("subtotal")}</dt><dd>{inr(order.itemsTotalPaise)}</dd></div>
            <div className="flex justify-between"><dt>{t("deliveryFee")}</dt><dd>{inr(order.deliveryFeePaise)}</dd></div>
            <div className="flex justify-between"><dt>{t("tax")}</dt><dd>{inr(order.taxPaise)}</dd></div>
            <div className="flex justify-between text-lg font-extrabold"><dt>{t("total")}</dt><dd>{inr(order.totalPaise)}</dd></div>
          </dl>
          <p className="mt-2 text-sm text-neutral-600">
            Payment: {order.paymentMethod === "COD" ? t("cod") : t("manualPay")} — {order.paymentStatus}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={reorder}>{t("reorder")}</button>
            {cancellable && (
              <button className="btn-danger" disabled={busy} onClick={cancel}>{t("cancelOrder")}</button>
            )}
          </div>
        </section>

        <section className="card" aria-label="Delivery and tracking">
          <h2 className="font-bold text-leaf-900">Delivery</h2>
          <p className="mt-1 text-sm">
            {order.customerName} · {order.mobile}
            <br />
            {order.addressLine}, {order.village} ({order.deliveryType === "field" ? t("fieldDelivery") : t("homeDelivery")})
          </p>
          {shop ? (
            <p className="mt-2 rounded-lg bg-cream p-3 text-sm">
              <strong>Sold by:</strong> {shop.name}
              <br />
              {shop.address} · {shop.mobile}
            </p>
          ) : (
            <p className="mt-2 text-sm text-neutral-600">Seller shop will appear here once the order is assigned.</p>
          )}
          <h2 className="mt-4 font-bold text-leaf-900">{t("orderTracking")}</h2>
          <ol className="mt-2 space-y-2">
            {history.map((h) => (
              <li key={h.id} className="flex gap-3">
                <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-leaf-500" aria-hidden="true" />
                <span>
                  <span className="font-semibold">{statusLabel(lang, h.status)}</span>
                  <span className="block text-xs text-neutral-500">
                    {new Date(h.at).toLocaleString("en-IN")} · by {h.actorRole}
                    {h.note ? ` — ${h.note}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
