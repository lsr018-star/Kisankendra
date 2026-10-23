"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, type SessionUser } from "@/lib/client";
import { useLang } from "@/components/LanguageProvider";

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const r = await api<{ ok: boolean; message: string; demoOtp?: string }>(
        "/api/auth/forgot-password",
        { method: "POST", body: JSON.stringify({ identifier }) },
      );
      if (r.demoOtp) setDemoOtp(r.demoOtp);
      setInfo(r.message);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await api<{ user: SessionUser }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ identifier, otp, newPassword }),
      });
      const dest =
        r.user.role === "admin" ? "/admin" : r.user.role === "farmer" ? "/farmer" : "/shop";
      router.push(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card mx-auto max-w-md">
      <h1 className="text-2xl font-bold">{t("resetTitle")}</h1>
      <p className="mt-1 text-sm text-neutral-600">{t("forgotHint")}</p>

      {step === 1 && (
        <form onSubmit={sendOtp} className="mt-5 flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="fp-id">Email / Mobile Number</label>
            <input
              id="fp-id"
              required
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "…" : t("sendOtp")}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={reset} className="mt-5 flex flex-col gap-4">
          {info && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900">{info}</p>}
          {demoOtp && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <strong>Demo mode:</strong> real SMS is not connected yet, so your OTP is shown
              here — <span className="text-lg font-bold tracking-widest">{demoOtp}</span>
              <br />
              <span className="text-xs">डेमो मोड: असली SMS अभी जुड़ा नहीं है, इसलिए OTP यहीं दिखाया गया है।</span>
            </p>
          )}
          <div>
            <label className="label" htmlFor="fp-otp">{t("enterOtp")}</label>
            <input
              id="fp-otp"
              required
              inputMode="numeric"
              maxLength={6}
              className="input tracking-widest"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              autoComplete="one-time-code"
            />
          </div>
          <div>
            <label className="label" htmlFor="fp-pw">{t("newPassword")}</label>
            <input
              id="fp-pw"
              required
              type="password"
              minLength={6}
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "…" : t("setPasswordLogin")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => sendOtp()}
            className="text-sm font-semibold text-leaf-700 underline"
          >
            {t("resendOtp")}
          </button>
        </form>
      )}

      <p className="mt-4 text-sm">
        <Link href="/login?as=farmer" className="font-semibold text-leaf-700 underline">
          ← {t("login")}
        </Link>
      </p>
    </div>
  );
}
