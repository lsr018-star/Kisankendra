"use client";

import ShopNav from "@/components/ShopNav";
import AnalyticsView from "@/components/AnalyticsView";
import { useLang } from "@/components/LanguageProvider";

export default function ShopAnalyticsPage() {
  const { t } = useLang();
  return (
    <div>
      <ShopNav />
      <h2 className="mb-3 text-lg font-bold text-leaf-900">{t("analytics")}</h2>
      <AnalyticsView base="/api/shop/analytics" />
    </div>
  );
}
