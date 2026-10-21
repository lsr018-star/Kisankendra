import fs from "fs";
import os from "os";
import path from "path";
import { uid } from "./password";

// Ticket image storage. Images are files on disk (not data URLs in the
// store) under a data/uploads directory, with the same serverless fallback
// strategy as lib/db.ts: local data dir first, OS temp dir second. File
// names are generated (`upl_<random>.<ext>`) — user input never reaches a
// path, which keeps the serving route traversal-safe by construction.

const PRIMARY_DIR = path.join(process.cwd(), "data", "uploads");
const FALLBACK_DIR = path.join(os.tmpdir(), "kisankendra-data", "uploads");

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

export const UPLOAD_NAME_PATTERN = /^upl_[a-z0-9]+\.(png|jpg|webp|gif)$/;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export function extensionForMime(mime: string): string | null {
  return EXT_BY_MIME[mime] ?? null;
}

export function saveUpload(buffer: Buffer, ext: string): string | null {
  const name = `${uid("upl_")}.${ext}`;
  for (const dir of [PRIMARY_DIR, FALLBACK_DIR]) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, name), buffer);
      return name;
    } catch {
      // read-only fs (serverless) — try the fallback dir
    }
  }
  return null;
}

export function readUpload(name: string): { buffer: Buffer; contentType: string } | null {
  if (!UPLOAD_NAME_PATTERN.test(name)) return null;
  const ext = name.split(".").pop()!;
  for (const dir of [PRIMARY_DIR, FALLBACK_DIR]) {
    const file = path.join(dir, name);
    try {
      if (fs.existsSync(file)) {
        return { buffer: fs.readFileSync(file), contentType: MIME_BY_EXT[ext] ?? "application/octet-stream" };
      }
    } catch {
      // try next dir
    }
  }
  return null;
}
