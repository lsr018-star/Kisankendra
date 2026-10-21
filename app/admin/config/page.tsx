"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import AdminNav from "@/components/AdminNav";

interface ConfigData {
  commissionPct: number;
  deliveryFeePaise: number;
  taxPct: number;
  refundNote: string;
  lowStockThreshold: number;
}

export default function AdminConfigPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ config: ConfigData }>("/api/admin/config").then((r) => setConfig(r.config)).catch(() => {});
  }, []);

  if (!config) return <div><AdminNav /><p>Loading…</p></div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await api<{ config: ConfigData }>("/api/admin/config", {
      method: "PATCH",
      body: JSON.stringify(config),
    });
    setConfig(r.config);
    setMsg("Settings saved. New checkout totals use these values immediately.");
  };

  return (
    <div>
      <AdminNav />
      <div className="card max-w-xl">
        <h2 className="text-lg font-bold text-leaf-900">Platform Financial Configuration</h2>
        <p className="text-sm text-neutral-600">
          These settings drive every order&apos;s auditable financial breakdown. Commission, shop supply price,
          customer selling price and margin are always recorded separately — never treated as the same amount.
          Payment gateway keys are configured only in Phase 3, after the seller-of-record and settlement model
          is legally confirmed.
        </p>
        <form onSubmit={save} className="mt-4 flex flex-col gap-3">
          <div>
            <label className="label" htmlFor="cfg-comm">Platform commission (%)</label>
            <input id="cfg-comm" type="number" min={0} max={60} className="input" value={config.commissionPct}
              onChange={(e) => setConfig({ ...config, commissionPct: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label" htmlFor="cfg-fee">Delivery fee (₹)</label>
            <input id="cfg-fee" type="number" min={0} className="input" value={config.deliveryFeePaise / 100}
              onChange={(e) => setConfig({ ...config, deliveryFeePaise: Math.round(Number(e.target.value) * 100) })} />
          </div>
          <div>
            <label className="label" htmlFor="cfg-tax">Tax (%)</label>
            <input id="cfg-tax" type="number" min={0} max={40} className="input" value={config.taxPct}
              onChange={(e) => setConfig({ ...config, taxPct: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label" htmlFor="cfg-low">Low-stock threshold (units)</label>
            <input id="cfg-low" type="number" min={0} className="input" value={config.lowStockThreshold}
              onChange={(e) => setConfig({ ...config, lowStockThreshold: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label" htmlFor="cfg-refund">Refund policy note</label>
            <textarea id="cfg-refund" className="input" rows={3} value={config.refundNote}
              onChange={(e) => setConfig({ ...config, refundNote: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="cfg-sub">Shop subscription plans</label>
            <input id="cfg-sub" className="input" value="Phase 3 — subscription billing is enabled after the payment gateway and settlement model are configured." disabled />
          </div>
          {msg && <p className="rounded-lg bg-leaf-50 p-3 text-leaf-800" role="status">{msg}</p>}
          <button className="btn-primary" type="submit">Save Settings</button>
        </form>
      </div>
    </div>
  );
}
