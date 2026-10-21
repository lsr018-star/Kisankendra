import { fail, json } from "@/lib/api-helpers";
import { extensionForMime, saveUpload, MAX_UPLOAD_BYTES } from "@/lib/uploads";

// Image upload for support/crop tickets. Accepts multipart form data with
// a single `file` field (images only). The ticket form is public (Solution
// Box), so uploads are too — mitigations: image MIME whitelist, hard size
// cap, generated filenames, no executable content types.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return fail("A file field is required", 422);
  const ext = extensionForMime(file.type);
  if (!ext) return fail("Only PNG, JPEG, WebP or GIF images are accepted", 422);
  if (file.size > MAX_UPLOAD_BYTES) return fail("Image is too large. Please attach an image under 2 MB.", 422);
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = saveUpload(buffer, ext);
  if (!name) return fail("Could not store the image on this server", 500);
  return json({ name, url: `/api/uploads/${name}` }, 201);
}
