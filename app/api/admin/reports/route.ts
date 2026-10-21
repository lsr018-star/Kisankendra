import { loadStore } from "@/lib/db";
import { fail, isResponse, json, requireRole } from "@/lib/api-helpers";
import { marginReport, reconciliationReport, salesReport, type DateRange } from "@/lib/reports";
import { csvResponse, toCsv } from "@/lib/csv";

const rupees = (paise: number) => (paise / 100).toFixed(2);

// Admin reports: same pack as the shop reports, across all shops or one
// selected shop, plus a per-shop sales breakdown.
export async function GET(req: Request) {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "sales";
  const shopId = url.searchParams.get("shopId") || null;
  const range: DateRange = {
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  };
  const format = url.searchParams.get("format") ?? "json";
  if (!["sales", "margin", "reconciliation"].includes(type)) return fail("Unknown report type", 422);
  const store = loadStore();
  const shops = store.shops.map((s) => ({ id: s.id, name: s.name }));

  if (type === "sales") {
    const report = salesReport(store, shopId, range);
    const perShop = store.shops.map((s) => {
      const r = salesReport(store, s.id, range);
      return { shopId: s.id, shopName: s.name, orders: r.summary.orders, grossPaise: r.summary.grossPaise };
    });
    if (format === "csv") {
      return csvResponse(
        "admin-sales-report.csv",
        toCsv([
          ["Shop", "Orders", "Gross Sales (INR)"],
          ...perShop.map((p) => [p.shopName, p.orders, rupees(p.grossPaise)]),
          [],
          ["Order No", "Date", "Customer", "Village", "Status", "Total (INR)"],
          ...report.orders.map((o) => [o.orderNo, o.date, o.customerName, o.village, o.status, rupees(o.totalPaise)]),
        ])
      );
    }
    return json({ type, range, shops, perShop, report });
  }

  if (type === "margin") {
    const report = marginReport(store, shopId, range);
    if (format === "csv") {
      return csvResponse(
        "admin-margin-report.csv",
        toCsv([
          ["Order No", "Date", "Items (INR)", "Supply Cost (INR)", "Commission (INR)", "Margin (INR)"],
          ...report.orders.map((o) => [o.orderNo, o.date, rupees(o.itemsPaise), rupees(o.supplyPaise), rupees(o.commissionPaise), rupees(o.marginPaise)]),
          ["TOTAL", "", rupees(report.summary.itemsPaise), rupees(report.summary.supplyPaise), rupees(report.summary.commissionPaise), rupees(report.summary.marginPaise)],
        ])
      );
    }
    return json({ type, range, shops, report });
  }

  const report = reconciliationReport(store, shopId, range);
  if (format === "csv") {
    return csvResponse(
      "admin-reconciliation-report.csv",
      toCsv([
        ["Order No", "Date", "Order Status", "Payment Status", "Expected (INR)", "Collected (INR)", "Outstanding (INR)"],
        ...report.orders.map((o) => [o.orderNo, o.date, o.status, o.paymentStatus, rupees(o.expectedPaise), rupees(o.collectedPaise), rupees(o.outstandingPaise)]),
        ["TOTAL", "", "", "", rupees(report.summary.expectedPaise), rupees(report.summary.collectedPaise), rupees(report.summary.outstandingPaise)],
      ])
    );
  }
  return json({ type, range, shops, report });
}
