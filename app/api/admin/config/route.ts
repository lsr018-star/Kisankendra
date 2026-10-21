import { loadStore, saveStore, audit } from "@/lib/db";
import { fail, isResponse, json, requireRole } from "@/lib/api-helpers";

export async function GET() {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const store = loadStore();
  return json({ config: store.config });
}

export async function PATCH(req: Request) {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => null);
  const store = loadStore();
  if (Number.isFinite(body?.commissionPct)) store.config.commissionPct = Math.max(0, Math.min(60, Number(body.commissionPct)));
  if (Number.isFinite(body?.deliveryFeePaise)) store.config.deliveryFeePaise = Math.max(0, Math.round(Number(body.deliveryFeePaise)));
  if (Number.isFinite(body?.deliveryFeeRupees)) store.config.deliveryFeePaise = Math.max(0, Math.round(Number(body.deliveryFeeRupees) * 100));
  if (Number.isFinite(body?.taxPct)) store.config.taxPct = Math.max(0, Math.min(40, Number(body.taxPct)));
  if (typeof body?.refundNote === "string") store.config.refundNote = body.refundNote;
  if (Number.isFinite(body?.lowStockThreshold)) store.config.lowStockThreshold = Math.max(0, Math.round(Number(body.lowStockThreshold)));
  if (Number.isFinite(body?.nearExpiryDays)) store.config.nearExpiryDays = Math.max(1, Math.round(Number(body.nearExpiryDays)));
  if (Number.isFinite(body?.subscriptionGraceDays)) store.config.subscriptionGraceDays = Math.max(0, Math.round(Number(body.subscriptionGraceDays)));
  if (body?.paymentProvider === "manual" || body?.paymentProvider === "razorpay") store.config.paymentProvider = body.paymentProvider;
  if (typeof body?.upiId === "string" && body.upiId.trim()) store.config.upiId = body.upiId.trim();
  audit(store, user.id, "admin", "config.update", "config", "platform", JSON.stringify(store.config));
  saveStore();
  return json({ config: store.config });
}
