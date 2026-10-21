import { loadStore, saveStore } from "@/lib/db";
import { requireRole, fail, isResponse, json } from "@/lib/api-helpers";
import { uid } from "@/lib/password";
import type { Address } from "@/lib/types";

export async function GET() {
  const user = await requireRole(["farmer"]);
  if (isResponse(user)) return user;
  return json({ addresses: user.addresses });
}

export async function POST(req: Request) {
  const user = await requireRole(["farmer"]);
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => null);
  const store = loadStore();
  const fresh = store.users.find((u) => u.id === user.id)!;
  const addr: Address = {
    id: uid("addr_"),
    label: String(body?.label ?? "Home"),
    name: String(body?.name ?? fresh.name),
    mobile: String(body?.mobile ?? fresh.mobile),
    village: String(body?.village ?? ""),
    addressLine: String(body?.addressLine ?? ""),
    deliveryType: body?.deliveryType === "field" ? "field" : "home",
    instructions: String(body?.instructions ?? "") || undefined,
  };
  if (!addr.village || !addr.addressLine) return fail("Village and address are required", 422);
  fresh.addresses.push(addr);
  saveStore();
  return json({ addresses: fresh.addresses }, 201);
}

export async function PUT(req: Request) {
  const user = await requireRole(["farmer"]);
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => null);
  const store = loadStore();
  const fresh = store.users.find((u) => u.id === user.id)!;
  const idx = fresh.addresses.findIndex((a) => a.id === body?.id);
  if (idx === -1) return fail("Address not found", 404);
  fresh.addresses[idx] = { ...fresh.addresses[idx], ...body, id: fresh.addresses[idx].id };
  saveStore();
  return json({ addresses: fresh.addresses });
}

export async function DELETE(req: Request) {
  const user = await requireRole(["farmer"]);
  if (isResponse(user)) return user;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const store = loadStore();
  const fresh = store.users.find((u) => u.id === user.id)!;
  fresh.addresses = fresh.addresses.filter((a) => a.id !== id);
  saveStore();
  return json({ addresses: fresh.addresses });
}
