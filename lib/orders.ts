import type { Order, User } from "./types";

// Cost and margin fields are financial data. Shop staff without the
// "finance" permission never receive them.
export function serializeOrder(order: Order, viewer: User) {
  const hideCosts = viewer.role === "shop_staff" && !(viewer.permissions ?? []).includes("finance");
  const items = order.items.map((i) => {
    const { costPaise, ...rest } = i;
    return hideCosts ? rest : { ...rest, costPaise };
  });
  return {
    ...order,
    items,
    supplyTotalPaise: hideCosts ? undefined : order.supplyTotalPaise,
    commissionPaise: hideCosts ? undefined : order.commissionPaise,
  };
}

export function canViewOrder(order: Order, user: User): boolean {
  if (user.role === "admin") return true;
  if (user.role === "farmer") return order.farmerId === user.id;
  if (user.role === "shop_owner" || user.role === "shop_staff") return order.shopId === user.shopId;
  return false;
}
