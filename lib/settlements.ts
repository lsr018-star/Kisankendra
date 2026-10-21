import { audit } from "./db";
import { uid } from "./password";
import type { SettlementRecord, Store } from "./types";

// A settlement summarises what the platform owes a shop for a period:
// gross delivered sales, minus the platform commission, with the shop's
// supply value recorded alongside (the settlement amount due is the supply
// value plus any delivery fees the shop earned, which in this model are
// part of the gross collected from the customer by the shop itself — for
// COD the shop already holds the cash, so the settlement records the
// commission reconciliation; for gateway payments the platform holds the
// gross and pays out supply + delivery).
export function generateSettlement(
  store: Store,
  shopId: string,
  from: string,
  to: string,
  actorId: string
): SettlementRecord {
  const orders = store.orders.filter(
    (o) =>
      o.shopId === shopId &&
      o.status === "Delivered" &&
      o.createdAt.slice(0, 10) >= from &&
      o.createdAt.slice(0, 10) <= to
  );
  const record: SettlementRecord = {
    id: uid("stl_"),
    shopId,
    periodStart: `${from}T00:00:00.000Z`,
    periodEnd: `${to}T23:59:59.999Z`,
    grossPaise: orders.reduce((s, o) => s + o.totalPaise, 0),
    commissionPaise: orders.reduce((s, o) => s + o.commissionPaise, 0),
    supplyPaise: orders.reduce((s, o) => s + o.supplyTotalPaise, 0),
    status: "Open",
    createdAt: new Date().toISOString(),
  };
  store.settlements.unshift(record);
  audit(store, actorId, "admin", "settlement.generate", "settlement", record.id, `Shop ${shopId} ${from}..${to}: gross ${record.grossPaise}`);
  return record;
}
