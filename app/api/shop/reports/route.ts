import { loadStore } from "@/lib/db";
import { fail, isResponse, json, requireShopUser } from "@/lib/api-helpers";
import { hasPermission } from "@/lib/auth";
import { marginReport, reconciliationReport, salesReport, type DateRange } from "@/lib/reports";
import { csvResponse, toCsv } from "@/lib/csv";

const rupees = (paise: number) => (paise / 100).toFixed(2);

// Shop reports pack: sales, margin, reconciliation. Every figure is
// computed from this shop's own orders/payments only (tenant-scoped).
// Margin and reconciliation expose cost data, so staff need the finance
// permission — same rule as order cost redaction.
export async function GET(req: Request) {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "sales";
  const range: DateRange = {
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  };
  const format = url.searchParams.get("format") ?? "json";
  if (!["sales", "margin", "reconciliation"].includes(type)) return fail("Unknown report type", 422);
  if (type !== "sales" && user.role === "shop_staff" && !hasPermission(user, "finance")) {
    return fail("The finance permission is required for this report", 403);
  }
  const store = loadStore();
  const shopId = user.shopId!;

  if (type === "sales") {
    const report = salesReport(store, shopId, range);
    if (format === "csv") {
      return csvResponse(
        "sales-report.csv",
        toCsv([
          ["Order No", "Date", "Customer", "Village", "Source", "Status", "Total (INR)"],
          ...report.orders.map((o) => [o.orderNo, o.date, o.customerName, o.village, o.source, o.status, rupees(o.totalPaise)]),
          [],
          ["Product", "Pack", "Qty Sold", "Amount (INR)"],
          ...report.byProduct.map((p) => [p.productName, p.packSize, p.qty, rupees(p.amountPaise)]),
          [],
          ["Summary", "Orders", report.summary.orders],
          ["Summary", "Gross Sales (INR)", rupees(report.summary.grossPaise)],
        ])
      );
    }
    return json({ type, range, report });
  }

  if (type === "margin") {
    const report = marginReport(store, shopId, range);
    if (format === "csv") {
      return csvResponse(
        "margin-report.csv",
        toCsv([
          ["Order No", "Date", "Items (INR)", "Supply Cost (INR)", "Commission (INR)", "Margin (INR)"],
          ...report.orders.map((o) => [o.orderNo, o.date, rupees(o.itemsPaise), rupees(o.supplyPaise), rupees(o.commissionPaise), rupees(o.marginPaise)]),
          ["TOTAL", "", rupees(report.summary.itemsPaise), rupees(report.summary.supplyPaise), rupees(report.summary.commissionPaise), rupees(report.summary.marginPaise)],
        ])
      );
    }
    return json({ type, range, report });
  }

  const report = reconciliationReport(store, shopId, range);
  if (format === "csv") {
    return csvResponse(
      "reconciliation-report.csv",
      toCsv([
        ["Order No", "Date", "Order Status", "Payment Status", "Expected (INR)", "Collected (INR)", "Outstanding (INR)"],
        ...report.orders.map((o) => [o.orderNo, o.date, o.status, o.paymentStatus, rupees(o.expectedPaise), rupees(o.collectedPaise), rupees(o.outstandingPaise)]),
        ["TOTAL", "", "", "", rupees(report.summary.expectedPaise), rupees(report.summary.collectedPaise), rupees(report.summary.outstandingPaise)],
      ])
    );
  }
  return json({ type, range, report });
}
