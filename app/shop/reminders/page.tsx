"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useLang } from "@/components/LanguageProvider";
import ShopNav from "@/components/ShopNav";

interface ReminderRow {
  id: string;
  type: string;
  text: string;
  dueDate: string;
  done: boolean;
  customerId?: string;
}

export default function ShopRemindersPage() {
  const { t } = useLang();
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [form, setForm] = useState({ type: "follow-up", text: "", dueDate: new Date().toISOString().slice(0, 10) });
  const [msg, setMsg] = useState("");

  const load = () =>
    api<{ reminders: ReminderRow[] }>("/api/shop/reminders").then((r) => setReminders(r.reminders)).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api("/api/shop/reminders", { method: "POST", body: JSON.stringify(form) });
    setForm({ type: "follow-up", text: "", dueDate: new Date().toISOString().slice(0, 10) });
    setMsg("Reminder created. Promotional messages are sent only to customers who recorded consent.");
    load();
  };

  const toggle = async (r: ReminderRow) => {
    await api("/api/shop/reminders", { method: "PATCH", body: JSON.stringify({ id: r.id, done: !r.done }) });
    load();
  };

  return (
    <div>
      <ShopNav />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="card self-start" aria-label="Reminders">
          <h2 className="text-lg font-bold text-leaf-900">{t("reminders")}</h2>
          <ul className="mt-3 divide-y">
            {reminders.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <input type="checkbox" checked={r.done} onChange={() => toggle(r)} aria-label={`Mark done: ${r.text}`} className="h-5 w-5" />
                <span className={r.done ? "line-through text-neutral-500" : ""}>
                  <span className="font-semibold">{r.text}</span>
                  <span className="block text-xs text-neutral-500">{r.type} · due {r.dueDate}</span>
                </span>
              </li>
            ))}
            {reminders.length === 0 && <li className="py-2 text-neutral-600">No reminders yet.</li>}
          </ul>
        </section>
        <section className="card self-start" aria-label="New reminder">
          <h2 className="text-lg font-bold text-leaf-900">New Reminder</h2>
          <form onSubmit={create} className="mt-3 flex flex-col gap-3">
            <div>
              <label className="label" htmlFor="rm-type">Type</label>
              <select id="rm-type" className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="follow-up">Customer follow-up</option>
                <option value="stock">Stock replenishment</option>
                <option value="licence">Licence renewal</option>
                <option value="service">Customer service task</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="rm-text">Reminder</label>
              <input id="rm-text" required className="input" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="rm-date">Due date</label>
              <input id="rm-date" type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            {msg && <p className="rounded-lg bg-leaf-50 p-3 text-leaf-800" role="status">{msg}</p>}
            <button className="btn-primary" type="submit">Create</button>
          </form>
        </section>
      </div>
    </div>
  );
}
