import { loadStore } from "@/lib/db";
import { isResponse, json, requireShopUser } from "@/lib/api-helpers";

// A shop sees its own settlement ledger and payment records only.
export async function GET() {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  const store = loadStore();
  return json({
    settlements: store.settlements.filter((s) => s.shopId === user.shopId),
    payments: store.payments.filter((p) => p.shopId === user.shopId).slice(0, 50),
    refunds: store.refunds.filter((r) => {
      const p = store.payments.find((x) => x.id === r.paymentId);
      return p?.shopId === user.shopId;
    }),
  });
}
