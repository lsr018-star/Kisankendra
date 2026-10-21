"use client";

import AdminNav from "@/components/AdminNav";
import AnalyticsView from "@/components/AnalyticsView";
import { useLang } from "@/components/LanguageProvider";

export default function AdminAnalyticsPage() {
  const { t } = useLang();
  return (
    <div>
      <AdminNav />
      <h2 className="mb-3 text-lg font-bold text-leaf-900">{t("analytics")}</h2>
      <AnalyticsView base="/api/admin/analytics" admin />
    </div>
  );
}
