"use client";

import Link from "next/link";
import { useLang } from "./LanguageProvider";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-leaf-900 text-leaf-100 mt-12">
      <div className="mx-auto max-w-7xl px-4 py-8 grid gap-6 sm:grid-cols-3 text-sm">
        <div>
          <p className="text-white font-bold text-base">{t("brand")}</p>
          <p className="mt-1">{t("tagline")}</p>
          <p className="mt-3">
            Seoni Malwa, Narmadapuram District,
            <br />
            Madhya Pradesh, India
          </p>
        </div>
        <nav className="flex flex-col gap-2" aria-label="Footer">
          <Link href="/faq" className="hover:underline py-1">{t("faq")}</Link>
          <Link href="/contact" className="hover:underline py-1">{t("contact")}</Link>
          <Link href="/grievance" className="hover:underline py-1">{t("grievance")}</Link>
        </nav>
        <nav className="flex flex-col gap-2" aria-label="Legal">
          <Link href="/privacy" className="hover:underline py-1">{t("privacy")}</Link>
          <Link href="/terms" className="hover:underline py-1">{t("terms")}</Link>
          <Link href="/catalogue" className="hover:underline py-1">{t("catalogue")}</Link>
          <Link href="/login?as=admin" className="hover:underline py-1">Owner Login</Link>
        </nav>
      </div>
      <div className="border-t border-leaf-700 py-3 text-center text-xs text-leaf-200 px-4">
        {t("demoData")} Seller identity and legal disclosures for each order appear on the order page and invoice.
      </div>
    </footer>
  );
}
