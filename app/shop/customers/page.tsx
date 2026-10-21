"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useLang } from "@/components/LanguageProvider";
import ShopNav from "@/components/ShopNav";
import { VILLAGES } from "@/lib/villages";

interface CustomerRow {
  id: string;
  customerCode: string;
  name: string;
  mobile: string;
  village: string;
  createdAt: string;
}

export default function ShopCustomersPage() {
  const { t } = useLang();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ name: "", mobile: "", village: "Seoni Malwa", addressLine: "", consentMarketing: false });

  const load = (query = q) =>
    api<{ customers: CustomerRow[] }>(`/api/shop/customers${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then((r) => setCustomers(r.customers))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load customers"));

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const h = setTimeout(() => load(), 300);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const addCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await api("/api/shop/customers", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", mobile: "", village: "Seoni Malwa", addressLine: "", consentMarketing: false });
      setMsg("Customer added.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add customer");
    }
  };

  const exportCsv = () => {
    const rows = [["Customer ID", "Name", "Mobile", "Village", "Since"], ...customers.map((c) => [c.customerCode, c.name, c.mobile, c.village, c.createdAt.slice(0, 10)])];
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <ShopNav />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="card self-start" aria-label="Customers">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-leaf-900">{t("customers")} ({customers.length})</h2>
            <button className="btn-secondary ml-auto" onClick={exportCsv}>Export CSV</button>
          </div>
          <label className="label mt-3" htmlFor="cq">{t("search")}</label>
          <input id="cq" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchCustomers")} />
          <ul className="mt-3 divide-y">
            {customers.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2 py-2.5">
                <Link href={`/shop/customers/${c.id}`} className="font-bold text-leaf-800 underline">{c.name}</Link>
                <span className="rounded bg-cream px-2 py-0.5 text-xs font-bold">{c.customerCode}</span>
                <span className="text-sm">{c.mobile}</span>
                <span className="text-sm text-neutral-600">{c.village}</span>
              </li>
            ))}
            {customers.length === 0 && <li className="py-3 text-neutral-600">{t("noResults")}</li>}
          </ul>
        </section>

        <section className="card self-start" aria-label="Add customer">
          <h2 className="text-lg font-bold text-leaf-900">{t("addCustomer")}</h2>
          <form onSubmit={addCustomer} className="mt-3 flex flex-col gap-3">
            <div>
              <label className="label" htmlFor="ac-name">{t("fullName")}</label>
              <input id="ac-name" required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="ac-mobile">{t("mobile")}</label>
              <input id="ac-mobile" required inputMode="numeric" className="input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="ac-village">{t("village")}</label>
              <select id="ac-village" className="input" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })}>
                {VILLAGES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ac-addr">{t("address")}</label>
              <input id="ac-addr" className="input" value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.consentMarketing} onChange={(e) => setForm({ ...form, consentMarketing: e.target.checked })} />
              Customer consents to promotional messages (recorded with date)
            </label>
            {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
            {msg && <p className="rounded-lg bg-leaf-50 p-3 text-leaf-800" role="status">{msg}</p>}
            <button className="btn-primary" type="submit">{t("addCustomer")}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
