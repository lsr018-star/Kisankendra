import { loadStore, saveStore, audit } from "@/lib/db";
import { fail, isResponse, json, requireRole } from "@/lib/api-helpers";

export async function GET() {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const store = loadStore();
  return json({ tickets: store.tickets });
}

export async function PATCH(req: Request) {
  const user = await requireRole(["admin"]);
  if (isResponse(user)) return user;
  const body = await req.json().catch(() => null);
  const store = loadStore();
  const ticket = store.tickets.find((t) => t.id === body?.id);
  if (!ticket) return fail("Ticket not found", 404);
  if (body?.status && ["Open", "In Progress", "Closed"].includes(body.status)) ticket.status = body.status;
  if (typeof body?.assignedTo === "string") ticket.assignedTo = body.assignedTo;
  if (typeof body?.response === "string" && body.response.trim()) {
    ticket.responses.push({
      by: user.name,
      byRole: "admin",
      text: body.response.trim(),
      at: new Date().toISOString(),
    });
    if (ticket.status === "Open") ticket.status = "In Progress";
  }
  audit(store, user.id, "admin", "ticket.update", "ticket", ticket.id, `status ${ticket.status}`);
  saveStore();
  return json({ ticket });
}
