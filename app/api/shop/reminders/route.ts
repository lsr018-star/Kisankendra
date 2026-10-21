import { loadStore, saveStore } from "@/lib/db";
import { fail, isResponse, json, requireShopUser } from "@/lib/api-helpers";
import { uid } from "@/lib/password";
import type { Reminder } from "@/lib/types";

export async function GET() {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  const store = loadStore();
  return json({ reminders: store.reminders.filter((r) => r.shopId === user.shopId) });
}

export async function POST(req: Request) {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => null);
  const text = String(body?.text ?? "").trim();
  if (!text) return fail("Reminder text is required", 422);
  const types = ["follow-up", "stock", "licence", "service"] as const;
  const type = types.includes(body?.type) ? body.type : "service";
  const store = loadStore();
  const reminder: Reminder = {
    id: uid("rem_"),
    shopId: user.shopId!,
    customerId: body?.customerId ? String(body.customerId) : undefined,
    type,
    text,
    dueDate: String(body?.dueDate ?? new Date().toISOString().slice(0, 10)),
    done: false,
    createdAt: new Date().toISOString(),
  };
  store.reminders.unshift(reminder);
  saveStore();
  return json({ reminder }, 201);
}

export async function PATCH(req: Request) {
  const user = await requireShopUser();
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => null);
  const store = loadStore();
  const reminder = store.reminders.find((r) => r.id === body?.id);
  if (!reminder || reminder.shopId !== user.shopId) return fail("Reminder not found", 404);
  if (typeof body?.done === "boolean") reminder.done = body.done;
  saveStore();
  return json({ reminder });
}
