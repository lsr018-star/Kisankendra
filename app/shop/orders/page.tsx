"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import { statusLabel } from "@/lib/i18n";
import { useLang } from "@/components/LanguageProvider";
import ShopNav from "@/components/ShopNav";

interface ShopOrder {
  id: string;
  orderNo: string;
  status: string;
  source: string;
  customerName: string;
  mobile: string;
  village: string;
  addressLine: string;
  deliveryType: string;
  paymentMethod: string;
  paymentStatus: string;
  totalPaise: number;
  itemsTotalPaise: number;
  supplyTotalPaise?: number;
  commissionPaise?: number;
  createdAt: string;
  items: { productName: string; packSize: string; qty: number; lineTotalPaise: number; costPaise?: number }[];
}

const NEXT: Record<string, string[]> = {
  Accepted: ["Processing"],
  Processing: ["Ready for Dispatch"],
  "Ready for Dispatch": ["Out for Delivery"],
  "Out for Delivery": ["Delivered"],
  Delivered: ["Returned"],
};

export default function ShopOrdersPage() {
  const { lang, t } = useLang();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = () =>
    api<{ orders: ShopOrder[] }>("/api/orders").then((r) => setOrders(r.orders)).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const act = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    setMsg("");
    try {
      await api(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId("");
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Order No", "Date", "Source", "Customer", "Mobile", "Village", "Items", "Total", "Status", "Payment"],
      ...orders.map((o) => [
        o.orderNo,
        o.createdAt.slice(0, 10),
        o.source === "manual" ? "Manual (shop)" : "Platform",
        o.customerName,
        o.mobile,
        o.village,
        o.items.map((i) => `${i.productName} x${i.qty}`).join("; "),
        (o.totalPaise / 100).toFixed(2),
        o.status,
        o.paymentStatus,
      ]),
    ];
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "shop-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <ShopNav />
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-lg font-bold text-leaf-900">{t("orders")} ({orders.length})</h2>
        <button className="btn-secondary ml-auto" onClick={exportCsv}>Export CSV</button>
      </div>
      {msg && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-amber-900" role="status">{msg}</p>}
      <div className="flex flex-col gap-3">
        {orders.map((o) => (
          <article key={o.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-leaf-900">{o.orderNo}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${o.source === "manual" ? "bg-cream text-neutral-700" : "bg-leaf-100 text-leaf-800"}`}>
                {o.source === "manual" ? "Manual (shop-entered)" : "Platform order"}
              </span>
              <span className="rounded-full bg-leaf-600 px-2.5 py-0.5 text-xs font-bold text-white">{statusLabel(lang, o.status)}</span>
              <span className="text-sm text-neutral-500">{new Date(o.createdAt).toLocaleString("en-IN")}</span>
              <span className="ml-auto text-lg font-extrabold">{inr(o.totalPaise)}</span>
            </div>
            <p className="mt-1 text-sm">
              {o.customerName} · {o.mobile} · {o.addressLine}, {o.village} ({o.deliveryType})
            </p>
            <ul className="mt-1 text-sm text-neutral-700">
              {o.items.map((i, idx) => (
                <li key={idx}>
                  {i.productName} ({i.packSize}) ×{i.qty} — {inr(i.lineTotalPaise)}
                  {typeof i.costPaise === "number" && <span className="text-neutral-500"> · supply cost {inr(i.costPaise)} each</span>}
                </li>
              ))}
            </ul>
            <p className="text-sm text-neutral-600">
              Payment: {o.paymentMethod} — {o.paymentStatus}
              {typeof o.supplyTotalPaise === "number" && <> · Supply total {inr(o.supplyTotalPaise)}</>}
              {typeof o.commissionPaise === "number" && o.commissionPaise > 0 && <> · Platform commission {inr(o.commissionPaise)}</>}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {o.status === "Pending" && o.source === "platform" && (
                <>
                  <button className="btn-primary" disabled={busyId === o.id} onClick={() => act(o.id, { action: "accept" })}>{t("accept")}</button>
                  <button className="btn-danger" disabled={busyId === o.id} onClick={() => act(o.id, { action: "reject", reason: "Cannot fulfil" })}>{t("reject")}</button>
                </>
              )}
              {(NEXT[o.status] ?? []).map((n) => (
                <button key={n} className="btn-primary" disabled={busyId === o.id} onClick={() => act(o.id, { action: "status", status: n })}>
                  Mark {statusLabel(lang, n)}
                </button>
              ))}
              {["Accepted", "Processing"].includes(o.status) && (
                <button className="btn-danger" disabled={busyId === o.id} onClick={() => act(o.id, { action: "status", status: "Cancelled", note: "Cancelled by shop" })}>
                  {t("cancel")}
                </button>
              )}
            </div>
          </article>
        ))}
        {orders.length === 0 && <div className="card text-center text-neutral-600">No orders assigned to your shop yet.</div>}
      </div>
    </div>
  );
}
