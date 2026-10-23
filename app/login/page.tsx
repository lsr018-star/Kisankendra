"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, type SessionUser } from "@/lib/client";
import { useLang } from "@/components/LanguageProvider";

function LoginInner() {
  const { t } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const as = params.get("as") ?? "";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await api<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      const dest =
        r.user.role === "admin" ? "/admin" : r.user.role === "farmer" ? "/farmer" : "/shop";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const isAdmin = as === "admin";
  return (
    <div className={`card mx-auto max-w-md ${isAdmin ? "border-2 border-tang-500" : ""}`}>
      {isAdmin && (
        <p className="-mx-4 -mt-4 mb-4 rounded-t-xl bg-tang-500 px-4 py-2.5 text-center font-bold text-white">
          👑 OWNER / ADMIN PANEL — sirf platform owner ke liye
        </p>
      )}
      <h1 className="text-2xl font-bold text-leaf-900">
        {as === "shop" ? t("shopLogin") : as === "farmer" ? t("farmerLogin") : as === "admin" ? "Owner Login" : t("login")}
      </h1>
      <p className="mt-1 text-sm text-neutral-600">
        {as === "shop"
          ? "For shops that are already registered and approved. New shop? Use “Register your shop” below — login starts after owner approval."
          : "Use your email or mobile number and password."}
      </p>
      <div className="mt-3 flex gap-2" role="navigation" aria-label="Login type">
        <Link
          href="/login?as=farmer"
          className={`rounded-full px-3 py-1.5 text-sm font-semibold ${as === "farmer" ? "bg-leaf-700 text-white" : "bg-cream text-leaf-800"}`}
        >
          {t("farmerLogin")}
        </Link>
        <Link
          href="/login?as=shop"
          className={`rounded-full px-3 py-1.5 text-sm font-semibold ${as === "shop" ? "bg-leaf-700 text-white" : "bg-cream text-leaf-800"}`}
        >
          {t("shopLogin")}
        </Link>
        <Link
          href="/login?as=admin"
          className={`rounded-full px-3 py-1.5 text-sm font-semibold ${as === "admin" ? "bg-leaf-700 text-white" : "bg-cream text-leaf-800"}`}
        >
          Owner Login
        </Link>
      </div>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <div>
          <label className="label" htmlFor="li-id">{t("email")} / {t("mobile")}</label>
          <input id="li-id" required className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" />
        </div>
        <div>
          <label className="label" htmlFor="li-pw">{t("password")}</label>
          <input id="li-pw" required type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className={`btn-primary w-full ${isAdmin ? "!bg-tang-500 hover:!bg-tang-600" : ""}`}>{busy ? "…" : t("login")}</button>
      </form>
      <div className="mt-4 flex flex-col gap-1 text-sm">
        <p>
          <Link href="/forgot-password" className="font-semibold text-leaf-700 underline">{t("forgotPassword")}</Link>
        </p>
        <p>
          New farmer? <Link href="/register" className="font-semibold text-leaf-700 underline">{t("register")}</Link>
        </p>
        <p>
          New partner shop? <Link href="/register/shop" className="font-semibold text-leaf-700 underline">Register your shop</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <LoginInner />
    </Suspense>
  );
}
