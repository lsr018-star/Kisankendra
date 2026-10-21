import { loadStore, saveStore, nextSeq, audit } from "@/lib/db";
import { currentUser, fail, json } from "@/lib/api-helpers";
import { UPLOAD_NAME_PATTERN } from "@/lib/uploads";
import { uid } from "@/lib/password";
import type { Ticket } from "@/lib/types";

// Solution Box / crop support tickets. Anyone can submit (the form is on the
// public homepage); farmers see their own tickets, admins see all.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const mobile = String(body?.mobile ?? "").trim();
  const description = String(body?.description ?? "").trim();
  if (!name || !mobile || !description) {
    return fail("Name, mobile and a description of the problem are required", 422);
  }
  const imageDataUrl = typeof body?.imageDataUrl === "string" ? body.imageDataUrl : undefined;
  if (imageDataUrl && imageDataUrl.length > 700_000) {
    return fail("Image is too large. Please attach an image under 500 KB.", 422);
  }
  // New uploads are files: accept only names previously issued by
  // /api/uploads (generated pattern), never arbitrary paths.
  const imageFile =
    typeof body?.imageFile === "string" && UPLOAD_NAME_PATTERN.test(body.imageFile)
      ? body.imageFile
      : undefined;
  const user = await currentUser();
  const store = loadStore();
  const seq = nextSeq(store, "ticket", 100);
  const ticket: Ticket = {
    id: uid("tkt_"),
    type: body?.type === "support" ? "support" : body?.type === "crop" ? "crop" : "solution",
    farmerId: user?.role === "farmer" ? user.id : undefined,
    name,
    mobile,
    crop: String(body?.crop ?? "").trim() || undefined,
    stage: String(body?.stage ?? "").trim() || undefined,
    village: String(body?.village ?? "").trim() || undefined,
    symptoms: String(body?.symptoms ?? "").trim() || undefined,
    description,
    imageName: String(body?.imageName ?? "").trim() || undefined,
    imageDataUrl: imageFile ? undefined : imageDataUrl,
    imageFile,
    status: "Open",
    responses: [],
    createdAt: new Date().toISOString(),
  };
  store.tickets.unshift(ticket);
  audit(store, user?.id ?? "public", user?.role ?? "public", "ticket.create", "ticket", ticket.id, `Ticket T-${seq} created`);
  saveStore();
  return json({ ticket, ticketNo: `T-${seq}` }, 201);
}

export async function GET() {
  const user = await currentUser();
  if (!user) return fail("Login required", 401);
  const store = loadStore();
  if (user.role === "admin") return json({ tickets: store.tickets });
  if (user.role === "farmer") {
    return json({ tickets: store.tickets.filter((t) => t.farmerId === user.id || t.mobile === user.mobile) });
  }
  return fail("Not available for your role", 403);
}
