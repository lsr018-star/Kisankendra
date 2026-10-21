"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import AdminNav from "@/components/AdminNav";

interface ShopRow {
  id: string;
  name: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  villages: string[];
  status: string;
  licences: { pesticideNo: string; pesticideExpiry: string; fertilizerNo: string; fertilizerExpiry: string; verified: boolean };
  taxDetails: string;
  createdAt: string;
}

const STATUSES = ["Pending", "Under Review", "Approved", "Suspended", "Rejected"];

export default function AdminShopsPage() {
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [msg, setMsg] = useState("");

  const load = () =>
    api<{ shops: ShopRow[] }>("/api/admin/shops").then((r) => setShops(r.shops)).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const patch = async (id: string, body: Record<string, unknown>, note: string) => {
    await api(`/api/admin/shops/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    setMsg(note);
    load();
  };

  return (
    <div>
      <AdminNav />
      <h2 className="text-lg font-bold text-leaf-900">Shop Onboarding & Licence Verification</h2>
      <p className="text-sm text-neutral-600">
        Licence verification is an administrative decision based on documents checked through the proper
        process — never assumed from the numbers a shop typed in. Unverified shops cannot receive orders for
        regulated products.
      </p>
      {msg && <p className="mt-2 rounded-lg bg-leaf-50 p-3 text-leaf-800" role="status">{msg}</p>}
      <div className="mt-4 flex flex-col gap-3">
        {shops.map((s) => (
          <article key={s.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-leaf-900">{s.name}</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.status === "Approved" ? "bg-leaf-100 text-leaf-800" : s.status === "Pending" ? "bg-amber-100 text-amber-900" : "bg-neutral-200 text-neutral-700"}`}>
                {s.status}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.licences.verified ? "bg-leaf-600 text-white" : "bg-red-100 text-red-800"}`}>
                Licences {s.licences.verified ? "Verified" : "Not Verified"}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-700">
              Owner: {s.ownerName} · {s.mobile} · {s.email}
              <br />
              {s.address}
              <br />
              Service villages: {s.villages.join(", ")}
              <br />
              Pesticide licence: {s.licences.pesticideNo || "—"} (expiry {s.licences.pesticideExpiry || "—"}) ·
              Fertilizer licence: {s.licences.fertilizerNo || "—"} (expiry {s.licences.fertilizerExpiry || "—"})
              <br />
              Tax: {s.taxDetails || "—"} · Applied {new Date(s.createdAt).toLocaleDateString("en-IN")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="label mb-0" htmlFor={`st-${s.id}`}>Status</label>
              <select
                id={`st-${s.id}`}
                className="input w-44"
                value={s.status}
                onChange={(e) => patch(s.id, { status: e.target.value }, `${s.name} status set to ${e.target.value}`)}
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <button
                className={s.licences.verified ? "btn-danger" : "btn-primary"}
                onClick={() => patch(s.id, { verifyLicence: !s.licences.verified }, `${s.name} licence verification ${!s.licences.verified ? "marked verified" : "removed"}`)}
              >
                {s.licences.verified ? "Remove Licence Verification" : "Mark Licences Verified"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
