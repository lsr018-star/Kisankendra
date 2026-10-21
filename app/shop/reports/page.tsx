"use client";

import ShopNav from "@/components/ShopNav";
import ReportsView from "@/components/ReportsView";
import { useLang } from "@/components/LanguageProvider";

export default function ShopReportsPage() {
  const { t } = useLang();
  return (
    <div>
      <ShopNav />
      <h2 className="mb-3 text-lg font-bold text-leaf-900">{t("reports")}</h2>
      <ReportsView base="/api/shop/reports" />
    </div>
  );
}
