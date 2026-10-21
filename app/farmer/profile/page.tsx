"use client";

import { useEffect, useState } from "react";
import { api, fetchMe, type SessionUser } from "@/lib/client";
import { useLang } from "@/components/LanguageProvider";
import { VILLAGES } from "@/lib/villages";

interface AddressRow {
  id: string;
  label: string;
  name: string;
  mobile: string;
  village: string;
  addressLine: string;
  deliveryType: string;
}

export default function FarmerProfilePage() {
  const { t } = useLang();
  const [me, setMe] = useState<SessionUser | null>(null);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [name, setName] = useState("");
  const [village, setVillage] = useState("Seoni Malwa");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ label: "Home", village: "Seoni Malwa", addressLine: "", deliveryType: "home" });

  const loadAddresses = () =>
    api<{ addresses: AddressRow[] }>("/api/farmer/addresses").then((r) => setAddresses(r.addresses)).catch(() => {});

  useEffect(() => {
    fetchMe().then((r) => {
      if (r?.user) {
        setMe(r.user);
        setName(r.user.name);
        setVillage(r.user.village ?? "Seoni Malwa");
      }
    });
    loadAddresses();
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await api("/api/auth/me", { method: "PATCH", body: JSON.stringify({ name, village }) });
    setMsg("Profile saved.");
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    await api("/api/farmer/addresses", {
      method: "POST",
      body: JSON.stringify({ ...form, name: me?.name, mobile: me?.mobile }),
    });
    setForm({ label: "Home", village: "Seoni Malwa", addressLine: "", deliveryType: "home" });
    setMsg("Address saved.");
    loadAddresses();
  };

  const removeAddress = async (id: string) => {
    await api(`/api/farmer/addresses?id=${id}`, { method: "DELETE" });
    loadAddresses();
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section className="card self-start" aria-label="Profile">
        <h1 className="text-xl font-bold text-leaf-900">{t("profile")}</h1>
        {msg && <p className="mt-2 rounded-lg bg-leaf-50 p-2.5 text-leaf-800" role="status">{msg}</p>}
        <form onSubmit={saveProfile} className="mt-3 flex flex-col gap-3">
          <div>
            <label className="label" htmlFor="pf-name">{t("fullName")}</label>
            <input id="pf-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="pf-mobile">{t("mobile")}</label>
            <input id="pf-mobile" className="input" value={me?.mobile ?? ""} disabled />
          </div>
          <div>
            <label className="label" htmlFor="pf-village">{t("village")}</label>
            <select id="pf-village" className="input" value={village} onChange={(e) => setVillage(e.target.value)}>
              {VILLAGES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <p className="text-sm text-neutral-600">
            {t("language")}: use the language selector in the top bar — your choice is saved on this device and on your profile.
          </p>
          <button className="btn-primary" type="submit">{t("save")}</button>
        </form>
      </section>

      <section className="card self-start" aria-label="Addresses">
        <h2 className="text-xl font-bold text-leaf-900">{t("addresses")}</h2>
        <ul className="mt-3 space-y-2">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-lg bg-cream p-3">
              <p className="font-semibold">{a.label} — {a.village}</p>
              <p className="text-sm">{a.addressLine} ({a.deliveryType === "field" ? t("fieldDelivery") : t("homeDelivery")})</p>
              <button className="mt-1 text-sm font-semibold text-red-700 underline" onClick={() => removeAddress(a.id)}>
                {t("remove")}
              </button>
            </li>
          ))}
          {addresses.length === 0 && <li className="text-neutral-600">No saved addresses yet.</li>}
        </ul>
        <form onSubmit={addAddress} className="mt-4 flex flex-col gap-3 border-t pt-4">
          <div>
            <label className="label" htmlFor="ad-label">Label</label>
            <input id="ad-label" className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="ad-village">{t("village")}</label>
            <select id="ad-village" className="input" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })}>
              {VILLAGES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ad-line">{t("address")}</label>
            <textarea id="ad-line" required className="input" rows={2} value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} />
          </div>
          <fieldset>
            <legend className="label">{t("deliveryType")}</legend>
            <label className="mr-4 inline-flex items-center gap-2">
              <input type="radio" name="adt" checked={form.deliveryType === "home"} onChange={() => setForm({ ...form, deliveryType: "home" })} /> {t("homeDelivery")}
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="adt" checked={form.deliveryType === "field"} onChange={() => setForm({ ...form, deliveryType: "field" })} /> {t("fieldDelivery")}
            </label>
          </fieldset>
          <button className="btn-primary" type="submit">{t("save")}</button>
        </form>
      </section>
    </div>
  );
}
