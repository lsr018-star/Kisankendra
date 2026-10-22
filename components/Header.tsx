"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, type SessionUser } from "@/lib/client";
import { useLang } from "./LanguageProvider";
import { useCart } from "./CartProvider";
import type { Lang } from "@/lib/types";

export default function Header() {
  const { lang, setLang, t } = useLang();
  const { count } = useCart();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchMe().then((r) => {
      setUser(r?.user ?? null);
      setLoaded(true);
    });
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const dashHref =
    user?.role === "farmer"
      ? "/farmer"
      : user?.role === "admin"
        ? "/admin"
        : user
          ? "/shop"
          : "/login";

  const ordersHref =
    user?.role === "admin"
      ? "/admin/orders"
      : user?.role === "shop_owner" || user?.role === "shop_staff"
        ? "/shop/orders"
        : "/farmer/orders";

  return (
    <header className="bg-leaf-800 text-white sticky top-0 z-40 shadow">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 py-2.5">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Kisankendra home">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-leaf-800 font-extrabold text-lg">
              K
            </span>
            <span className="leading-tight">
              <span className="block text-lg sm:text-xl font-bold">{t("brand")}</span>
              <span className="hidden sm:block text-[11px] text-leaf-100">{t("tagline")}</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center sm:order-3 sm:ml-0">
            <label className="sr-only" htmlFor="lang-select">{t("language")}</label>
            <select
              id="lang-select"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="rounded-lg bg-leaf-700 px-2 py-2 text-white min-h-[44px]"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>

          <nav className="order-3 flex w-full flex-wrap items-center gap-1 text-sm sm:order-2 sm:w-auto sm:flex-1 sm:justify-end sm:gap-2 sm:text-base" aria-label="Main">
            <Link href="/catalogue" className="rounded-lg px-2.5 py-2 hover:bg-leaf-700 min-h-[44px] flex items-center">
              {t("catalogue")}
            </Link>
            <Link href="/diseases" className="hidden md:flex rounded-lg px-2.5 py-2 hover:bg-leaf-700 min-h-[44px] items-center">
              {t("diseaseFinder")}
            </Link>
            <Link href="/sowing" className="hidden md:flex rounded-lg px-2.5 py-2 hover:bg-leaf-700 min-h-[44px] items-center">
              {t("sowingGuide")}
            </Link>
            <span className="ml-auto flex items-center gap-1 sm:ml-0 sm:gap-2">
              <Link href={ordersHref} className="rounded-lg px-2.5 py-2 hover:bg-leaf-700 min-h-[44px] flex items-center">
                {t("myOrders")}
              </Link>
              <Link href="/cart" className="rounded-lg px-2.5 py-2 hover:bg-leaf-700 min-h-[44px] flex items-center">
                {t("cart")}
                {count > 0 && (
                  <span className="ml-1.5 rounded-full bg-tang-500 px-2 py-0.5 text-xs font-bold">{count}</span>
                )}
              </Link>
            </span>
            {loaded && user && (
              <Link href={dashHref} className="hidden sm:flex rounded-lg px-2.5 py-2 hover:bg-leaf-700 min-h-[44px] items-center">
                {t("myDashboard")}
              </Link>
            )}
            {loaded && !user && (
              <>
                <Link href="/login?as=farmer" className="rounded-lg bg-white text-leaf-800 font-semibold px-3 py-2 min-h-[44px] flex items-center">
                  {t("farmerLogin")}
                </Link>
                <Link href="/login?as=shop" className="hidden md:flex rounded-lg border border-white px-3 py-2 min-h-[44px] items-center">
                  {t("shopLogin")}
                </Link>
              </>
            )}
            {loaded && user && (
              <button onClick={logout} className="rounded-lg border border-white px-3 py-2 min-h-[44px]">
                {t("logout")} ({user.name.split(" ")[0]})
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
