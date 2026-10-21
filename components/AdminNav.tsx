"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "./LanguageProvider";

export default function AdminNav() {
  const { t } = useLang();
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: t("dashboard") },
    { href: "/admin/shops", label: t("shops") },
    { href: "/admin/products", label: t("products") },
    { href: "/admin/orders", label: t("orders") },
    { href: "/admin/tickets", label: t("tickets") },
    { href: "/admin/users", label: t("users") },
    { href: "/admin/config", label: t("config") },
  ];
  return (
    <div className="mb-5">
      <h1 className="text-xl font-extrabold text-leaf-900">Kisankendra Admin</h1>
      <nav className="mt-3 flex flex-wrap gap-2" aria-label="Admin">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3.5 py-2 font-semibold min-h-[44px] flex items-center ${
              pathname === l.href ? "bg-leaf-800 text-white" : "bg-white text-leaf-800 ring-1 ring-leaf-200"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
