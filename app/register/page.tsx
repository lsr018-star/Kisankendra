"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useLang } from "@/components/LanguageProvider";
import { VILLAGES } from "@/lib/villages";

export default function FarmerRegisterPage() {
  const { t } = useLang();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", password: "", village: "Seoni Malwa" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/register/farmer", { method: "POST", body: JSON.stringify(form) });
      router.push("/login?as=farmer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-leaf-900">{t("register")} — Farmer</h1>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <div>
          <label className="label" htmlFor="rf-name">{t("fullName")}</label>
          <input id="rf-name" required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="rf-mobile">{t("mobile")}</label>
          <input id="rf-mobile" required inputMode="numeric" className="input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="rf-email">{t("email")} (optional)</label>
          <input id="rf-email" type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="rf-village">{t("village")}</label>
          <select id="rf-village" className="input" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })}>
            {VILLAGES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="rf-pw">{t("password")}</label>
          <input id="rf-pw" required type="password" minLength={6} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "…" : t("register")}</button>
      </form>
      <p className="mt-3 text-sm">
        Already registered? <Link href="/login?as=farmer" className="font-semibold text-leaf-700 underline">{t("farmerLogin")}</Link>
      </p>
    </div>
  );
}
