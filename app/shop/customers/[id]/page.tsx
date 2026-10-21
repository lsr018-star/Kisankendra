"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { inr } from "@/lib/money";
import { statusLabel } from "@/lib/i18n";
import { useLang } from "@/components/LanguageProvider";
import ShopNav from "@/components/ShopNav";

interface OrderLite {
  id: string;
  orderNo: string;
  status: string;
  totalPaise: number;
  paymentStatus: string;
  createdAt: string;
  items: { productName: string; packSize: string; qty: number }[];
}

interface ProfileData {
  customer: {
    id: string;
    customerCode: string;
    name: string;
    mobile: string;
    village: string;
    createdAt: string;
    consentMarketing: boolean;
    consentRecordedAt?: string;
    addresses: { id: string; label: string; addressLine: string; village: string; deliveryType: string }[];
    notes: { text: string; at: string; by: string }[];
  };
  platformOrders: OrderLite[];
  manualOrders: OrderLite[];
  assignedPending: OrderLite[];
  totalPurchaseValuePaise: number;
  supportHistory: { id: string; description: string; status: string; createdAt: string }[];
}

interface InvRow {
  id: string;
  productId: string;
  productName: string;
  packSize: string;
  pricePaise: number;
  available: number;
}

function OrderList({ title, orders, lang }: { title: string; orders: OrderLite[]; lang: "en" | "hi" }) {
  return (
    <div>
      <h3 className="font-bold text-leaf-900">{title} ({orders.length})</h3>
      {orders.length === 0 && <p className="text-sm text-neutral-600">None.</p>}
      <ul className="mt-1 divide-y">
        {orders.map((o) => (
          <li key={o.id} className="py-2 text-sm">
            <span className="font-bold">{o.orderNo}</span> · {new Date(o.createdAt).toLocaleDateString("en-IN")} ·{" "}
            {statusLabel(lang, o.status)} · Payment: {o.paymentStatus} · <strong>{inr(o.totalPaise)}</strong>
            <span className="block text-neutral-600">{o.items.map((i) => `${i.productName} (${i.packSize}) ×${i.qty}`).join(", ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang, t } = useLang();
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState("");
  const [reminderText, setReminderText] = useState("");
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().slice(0, 10));
  const [inventory, setInventory] = useState<InvRow[]>([]);
  const [mo, setMo] = useState({ productKey: "", qty: 1 });

  const load = () =>
    api<ProfileData>(`/api/shop/customers/${id}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Customer not found"));

  useEffect(() => {
    load();
    api<{ inventory: InvRow[] }>("/api/shop/inventory")
      .then((r) => setInventory(r.inventory.filter((i) => i.available > 0)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) {
    return (
      <div>
        <ShopNav />
        <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>
      </div>
    );
  }
  if (!data) return <div><ShopNav /><p>Loading…</p></div>;

  const c = data.customer;

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    await api(`/api/shop/customers/${id}`, { method: "POST", body: JSON.stringify({ action: "note", text: note }) });
    setNote("");
    setMsg("Note saved.");
    load();
  };

  const addReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    await api(`/api/shop/customers/${id}`, {
      method: "POST",
      body: JSON.stringify({ action: "reminder", text: reminderText, dueDate: reminderDate }),
    });
    setReminderText("");
    setMsg("Follow-up reminder created.");
  };

  const createManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const inv = inventory.find((i) => `${i.productId}|${i.packSize}` === mo.productKey);
    if (!inv) return;
    try {
      const r = await api<{ order: { orderNo: string } }>("/api/shop/manual-orders", {
        method: "POST",
        body: JSON.stringify({
          customerId: id,
          items: [{ productId: inv.productId, packSize: inv.packSize, qty: mo.qty }],
          markDelivered: true,
        }),
      });
      setMsg(`Walk-in order ${r.order.orderNo} recorded as delivered.`);
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not record order");
    }
  };

  return (
    <div>
      <ShopNav />
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <section className="card self-start" aria-label="Customer details">
          <h2 className="text-xl font-bold text-leaf-900">{c.name}</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-neutral-500">Customer ID</dt><dd className="font-bold">{c.customerCode}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">{t("mobile")}</dt><dd>{c.mobile}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">{t("village")}</dt><dd>{c.village}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">Customer since</dt><dd>{new Date(c.createdAt).toLocaleDateString("en-IN")}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">Marketing consent</dt><dd>{c.consentMarketing ? `Yes${c.consentRecordedAt ? ` (${c.consentRecordedAt.slice(0, 10)})` : ""}` : "No"}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">Total purchase value (this shop)</dt><dd className="font-bold">{inr(data.totalPurchaseValuePaise)}</dd></div>
          </dl>
          {c.addresses.length > 0 && (
            <>
              <h3 className="mt-3 font-bold text-leaf-900">{t("addresses")}</h3>
              <ul className="text-sm">
                {c.addresses.map((a) => (
                  <li key={a.id} className="py-1">{a.label}: {a.addressLine}, {a.village} ({a.deliveryType})</li>
                ))}
              </ul>
            </>
          )}
          <h3 className="mt-4 font-bold text-leaf-900">Notes</h3>
          <ul className="space-y-1 text-sm">
            {c.notes.map((n, i) => (
              <li key={i} className="rounded bg-cream p-2">{n.text} <span className="text-xs text-neutral-500">— {n.by}, {new Date(n.at).toLocaleDateString("en-IN")}</span></li>
            ))}
            {c.notes.length === 0 && <li className="text-neutral-600">No notes.</li>}
          </ul>
          <form onSubmit={addNote} className="mt-2 flex gap-2">
            <label className="sr-only" htmlFor="note">Add note</label>
            <input id="note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a service note…" />
            <button className="btn-secondary" type="submit">{t("save")}</button>
          </form>
          <form onSubmit={addReminder} className="mt-3 flex flex-col gap-2 border-t pt-3">
            <label className="label" htmlFor="rem-text">Follow-up reminder</label>
            <input id="rem-text" className="input" value={reminderText} onChange={(e) => setReminderText(e.target.value)} placeholder="Call about urea stock" />
            <input type="date" className="input" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} aria-label="Reminder date" />
            <button className="btn-secondary" type="submit">Create Reminder</button>
          </form>
          {msg && <p className="mt-2 rounded-lg bg-leaf-50 p-2.5 text-leaf-800" role="status">{msg}</p>}
        </section>

        <div className="flex flex-col gap-5">
          <section className="card" aria-label="Record walk-in purchase">
            <h3 className="font-bold text-leaf-900">Record Walk-in Purchase (Manual Order)</h3>
            <form onSubmit={createManualOrder} className="mt-2 flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <label className="label" htmlFor="mo-product">Product (from your stock)</label>
                <select id="mo-product" required className="input" value={mo.productKey} onChange={(e) => setMo({ ...mo, productKey: e.target.value })}>
                  <option value="">Select…</option>
                  {inventory.map((i) => (
                    <option key={i.id} value={`${i.productId}|${i.packSize}`}>
                      {i.productName} ({i.packSize}) — {inr(i.pricePaise)} · {i.available} available
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="mo-qty">{t("quantity")}</label>
                <input id="mo-qty" type="number" min={1} className="input w-24" value={mo.qty} onChange={(e) => setMo({ ...mo, qty: Number(e.target.value) || 1 })} />
              </div>
              <button className="btn-primary" type="submit">Record Sale</button>
            </form>
            <p className="mt-1 text-xs text-neutral-500">Manual orders are labelled separately from Kisankendra platform orders everywhere.</p>
          </section>

          <section className="card flex flex-col gap-4" aria-label="Order history">
            <OrderList title="1. Kisankendra Platform Orders" orders={data.platformOrders} lang={lang} />
            <OrderList title="2. Manual Orders (entered by this shop)" orders={data.manualOrders} lang={lang} />
            <OrderList title="3. Assigned, Not Yet Completed" orders={data.assignedPending} lang={lang} />
            <div>
              <h3 className="font-bold text-leaf-900">Support History</h3>
              {data.supportHistory.length === 0 && <p className="text-sm text-neutral-600">No support requests from this customer.</p>}
              <ul className="text-sm">
                {data.supportHistory.map((s) => (
                  <li key={s.id} className="py-1">{new Date(s.createdAt).toLocaleDateString("en-IN")} — {s.description} ({s.status})</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
