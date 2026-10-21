"use client";

import AdminNav from "@/components/AdminNav";
import ReportsView from "@/components/ReportsView";
import { useLang } from "@/components/LanguageProvider";

export default function AdminReportsPage() {
  const { t } = useLang();
  return (
    <div>
      <AdminNav />
      <h2 className="mb-3 text-lg font-bold text-leaf-900">{t("reports")}</h2>
      <ReportsView base="/api/admin/reports" admin />
    </div>
  );
}
