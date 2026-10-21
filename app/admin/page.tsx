"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import AdminNav from "@/components/AdminNav";

interface DashData {
  counts: Record<string, number>;
  shopsByStatus: Record<string, number>;
  ordersByStatus: Record<string, number>;
  auditLogs: { id: string; action: string; entity: string; details: string; at: string; actorRole: string }[];
  unassignedOrders: { id: string; orderNo: string; village: string; totalPaise: number }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<DashData>("/api/admin/dashboard")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load"));
  }, []);

  return (
    <div>
      <AdminNav />
      {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
      {data && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Users", data.counts.users],
              ["Farmers", data.counts.farmers],
              ["Shops", data.counts.shops],
              ["Products", data.counts.products],
              ["Orders", data.counts.orders],
              ["Unassigned Orders", data.counts.unassignedOrders],
              ["Open Tickets", data.counts.openTickets],
            ].map(([label, v]) => (
              <div key={label as string} className="card text-center">
                <p className="text-3xl font-extrabold text-leaf-700">{v}</p>
                <p className="text-sm text-neutral-600">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card" aria-label="Shops and orders by status">
              <h2 className="font-bold text-leaf-900">Shops by Status</h2>
              <ul className="mt-1 text-sm">
                {Object.entries(data.shopsByStatus).map(([k, v]) => (
                  <li key={k} className="flex justify-between py-1"><span>{k}</span><strong>{v}</strong></li>
                ))}
              </ul>
              <h2 className="mt-4 font-bold text-leaf-900">Orders by Status</h2>
              <ul className="mt-1 text-sm">
                {Object.entries(data.ordersByStatus).map(([k, v]) => (
                  <li key={k} className="flex justify-between py-1"><span>{k}</span><strong>{v}</strong></li>
                ))}
              </ul>
              {data.unassignedOrders.length > 0 && (
                <>
                  <h2 className="mt-4 font-bold text-tang-600">Needs Manual Assignment</h2>
                  <ul className="mt-1 text-sm">
                    {data.unassignedOrders.map((o) => (
                      <li key={o.id} className="py-1">
                        <Link href="/admin/orders" className="font-semibold underline">{o.orderNo}</Link> — {o.village} · {inr(o.totalPaise)}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="card" aria-label="Audit log">
              <h2 className="font-bold text-leaf-900">Recent Audit Log</h2>
              <ul className="mt-2 divide-y text-sm">
                {data.auditLogs.map((a) => (
                  <li key={a.id} className="py-1.5">
                    <span className="font-semibold">{a.action}</span> <span className="text-neutral-500">({a.entity}, {a.actorRole})</span>
                    <span className="block text-neutral-600">{a.details}</span>
                    <span className="text-xs text-neutral-400">{new Date(a.at).toLocaleString("en-IN")}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
