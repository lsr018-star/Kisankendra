import { readUpload } from "@/lib/uploads";

// Serves ticket images saved by /api/uploads. Names are validated against
// the generated-name pattern inside readUpload, so no path traversal is
// possible. Responses are cacheable but never HTML.
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const found = readUpload(name);
  if (!found) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(found.buffer), {
    status: 200,
    headers: {
      "content-type": found.contentType,
      "cache-control": "private, max-age=3600",
      "x-content-type-options": "nosniff",
    },
  });
}
