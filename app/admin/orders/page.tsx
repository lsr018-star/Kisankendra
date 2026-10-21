"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import AdminNav from "@/components/AdminNav";

interface AdminOrder {
  id: string;
  orderNo: string;
  status: string;
  source: string;
  customerName: string;
  mobile: string;
  village: string;
  totalPaise: number;
  itemsTotalPaise: number;
  supplyTotalPaise: number;
  commissionPaise: number;
  shopId?: string;
  createdAt: string;
  items: { productName: string; packSize: string; qty: number }[];
}

interface ShopLite {
  id: string;
  name: string;
  status: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [shops, setShops] = useState<ShopLite[]>([]);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const load = () => {
    api<{ orders: AdminOrder[] }>("/api/orders").then((r) => setOrders(r.orders)).catch(() => {});
    api<{ shops: ShopLite[] }>("/api/admin/shops").then((r) => setShops(r.shops)).catch(() => {});
  };

  useEffect(load, []);

  const shopName = (id?: string) => shops.find((s) => s.id === id)?.name ?? "—";

  const assign = async (orderId: string) => {
    const shopId = choice[orderId];
    if (!shopId) return;
    setMsg("");
    try {
      await api(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ action: "assign", shopId }) });
      setMsg("Order assigned.");
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Assignment failed");
    }
  };

  return (
    <div>
      <AdminNav />
      <h2 className="text-lg font-bold text-leaf-900">Order Monitoring</h2>
      {msg && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-amber-900" role="status">{msg}</p>}
      <div className="mt-3 flex flex-col gap-3">
        {orders.map((o) => (
          <article key={o.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{o.orderNo}</strong>
              <span className="rounded-full bg-leaf-100 px-2.5 py-0.5 text-xs font-bold text-leaf-800">{o.status}</span>
              <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-semibold">{o.source === "manual" ? "Manual (shop)" : "Platform"}</span>
              <span className="text-sm text-neutral-500">{new Date(o.createdAt).toLocaleString("en-IN")}</span>
              <span className="ml-auto font-extrabold">{inr(o.totalPaise)}</span>
            </div>
            <p className="mt-1 text-sm">
              {o.customerName} · {o.mobile} · {o.village} · Shop: <strong>{shopName(o.shopId)}</strong>
            </p>
            <p className="text-sm text-neutral-600">{o.items.map((i) => `${i.productName} (${i.packSize}) ×${i.qty}`).join(", ")}</p>
            <p className="text-sm text-neutral-600">
              Items {inr(o.itemsTotalPaise)} · Supply {inr(o.supplyTotalPaise)} · Commission {inr(o.commissionPaise)}
            </p>
            {o.status === "Unassigned" && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="label mb-0" htmlFor={`as-${o.id}`}>Assign to shop</label>
                <select
                  id={`as-${o.id}`}
                  className="input w-64"
                  value={choice[o.id] ?? ""}
                  onChange={(e) => setChoice({ ...choice, [o.id]: e.target.value })}
                >
                  <option value="">Select shop…</option>
                  {shops
                    .filter((s) => s.status === "Approved")
                    .map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <button className="btn-primary" onClick={() => assign(o.id)}>Assign</button>
              </div>
            )}
          </article>
        ))}
        {orders.length === 0 && <div className="card text-center text-neutral-600">No orders yet.</div>}
      </div>
    </div>
  );
}
