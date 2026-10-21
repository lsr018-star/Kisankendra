"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMe } from "@/lib/client";
import { useLang } from "./LanguageProvider";

export default function ShopNav() {
  const { t } = useLang();
  const pathname = usePathname();
  const [shopName, setShopName] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchMe().then((r) => {
      if (r?.shop) {
        setShopName(r.shop.name);
        setStatus(r.shop.status);
      }
    });
  }, []);

  const links = [
    { href: "/shop", label: t("dashboard") },
    { href: "/shop/onboarding", label: t("onboarding") },
    { href: "/shop/customers", label: t("customers") },
    { href: "/shop/orders", label: t("orders") },
    { href: "/shop/inventory", label: t("inventory") },
    { href: "/shop/reports", label: t("reports") },
    { href: "/shop/analytics", label: t("analytics") },
    { href: "/shop/subscription", label: t("subscriptions") },
    { href: "/shop/reminders", label: t("reminders") },
  ];

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-extrabold text-leaf-900">{shopName || "Shop ERP"}</h1>
        {status && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${status === "Approved" ? "bg-leaf-100 text-leaf-800" : "bg-amber-100 text-amber-900"}`}>
            {status}
          </span>
        )}
      </div>
      {status && status !== "Approved" && (
        <p className="mt-2 rounded-lg bg-amber-50 p-3 text-amber-900" role="status">
          Your shop is {status}. Orders are assigned only to Approved shops with verified licences.
        </p>
      )}
      <nav className="mt-3 flex flex-wrap gap-2" aria-label="Shop">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3.5 py-2 font-semibold min-h-[44px] flex items-center ${
              pathname === l.href ? "bg-leaf-600 text-white" : "bg-white text-leaf-800 ring-1 ring-leaf-200"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
