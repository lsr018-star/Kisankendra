"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useLang } from "@/components/LanguageProvider";
import { VILLAGES } from "@/lib/villages";

export default function ShopRegisterPage() {
  const { t } = useLang();
  const router = useRouter();
  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    mobile: "",
    email: "",
    password: "",
    address: "",
    pesticideLicence: "",
    pesticideExpiry: "",
    fertilizerLicence: "",
    fertilizerExpiry: "",
    taxDetails: "",
    deliveryCapable: true,
  });
  const [villages, setVillages] = useState<string[]>(["Seoni Malwa"]);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleVillage = (v: string) =>
    setVillages((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/register/shop", {
        method: "POST",
        body: JSON.stringify({ ...form, villages }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="card mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-bold text-leaf-800">Shop registered — Pending verification</h1>
        <p className="mt-2 text-neutral-700">
          Your shop application is now <strong>Pending</strong>. The Kisankendra team will verify your shop and
          licence details through the administrative process. You will be able to receive orders only after
          approval and licence verification. Uploaded licence numbers alone do not verify a shop.
        </p>
        <Link href="/login?as=shop" className="btn-primary mt-4">{t("shopLogin")}</Link>
      </div>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="card mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-leaf-900">Partner Shop Registration</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Shops start as Pending. Licences are verified by the Kisankendra admin team before a shop can sell
        regulated products (pesticides and fertilizers).
      </p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="rs-shop">Shop Name</label>
          <input id="rs-shop" required className="input" value={form.shopName} onChange={set("shopName")} />
        </div>
        <div>
          <label className="label" htmlFor="rs-owner">Owner / Authorised Representative</label>
          <input id="rs-owner" required className="input" value={form.ownerName} onChange={set("ownerName")} />
        </div>
        <div>
          <label className="label" htmlFor="rs-mobile">{t("mobile")}</label>
          <input id="rs-mobile" required inputMode="numeric" className="input" value={form.mobile} onChange={set("mobile")} />
        </div>
        <div>
          <label className="label" htmlFor="rs-email">{t("email")}</label>
          <input id="rs-email" type="email" className="input" value={form.email} onChange={set("email")} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="rs-addr">Shop Address</label>
          <textarea id="rs-addr" required className="input" rows={2} value={form.address} onChange={set("address")} />
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="label">Service Villages</legend>
          <div className="flex flex-wrap gap-3">
            {VILLAGES.map((v) => (
              <label key={v} className="inline-flex items-center gap-2 rounded-lg bg-cream px-3 py-2">
                <input type="checkbox" checked={villages.includes(v)} onChange={() => toggleVillage(v)} />
                {v}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="label" htmlFor="rs-pest">Pesticide Licence Number</label>
          <input id="rs-pest" className="input" value={form.pesticideLicence} onChange={set("pesticideLicence")} />
        </div>
        <div>
          <label className="label" htmlFor="rs-pestexp">Pesticide Licence Expiry</label>
          <input id="rs-pestexp" type="date" className="input" value={form.pesticideExpiry} onChange={set("pesticideExpiry")} />
        </div>
        <div>
          <label className="label" htmlFor="rs-fert">Fertilizer Licence Number</label>
          <input id="rs-fert" className="input" value={form.fertilizerLicence} onChange={set("fertilizerLicence")} />
        </div>
        <div>
          <label className="label" htmlFor="rs-fertexp">Fertilizer Licence Expiry</label>
          <input id="rs-fertexp" type="date" className="input" value={form.fertilizerExpiry} onChange={set("fertilizerExpiry")} />
        </div>
        <div>
          <label className="label" htmlFor="rs-tax">Business / Tax Details (e.g. GSTIN)</label>
          <input id="rs-tax" className="input" value={form.taxDetails} onChange={set("taxDetails")} />
        </div>
        <div>
          <label className="label" htmlFor="rs-pw">{t("password")}</label>
          <input id="rs-pw" required type="password" minLength={6} className="input" value={form.password} onChange={set("password")} autoComplete="new-password" />
        </div>
        <label className="inline-flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={form.deliveryCapable} onChange={(e) => setForm({ ...form, deliveryCapable: e.target.checked })} />
          We can deliver to homes and fields in our service villages
        </label>
        {error && <p className="rounded-lg bg-red-50 p-3 text-red-800 sm:col-span-2" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary sm:col-span-2">{busy ? "…" : "Submit Shop Application"}</button>
      </form>
      <p className="mt-3 text-sm">
        Already a partner? <Link href="/login?as=shop" className="font-semibold text-leaf-700 underline">{t("shopLogin")}</Link>
      </p>
    </div>
  );
}
