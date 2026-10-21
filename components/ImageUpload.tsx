"use client";

import { useState } from "react";

// Shared image picker for ticket forms: uploads the file to /api/uploads
// immediately (files are stored server-side, not as data URLs) and shows a
// preview thumbnail. Reports the stored file name to the parent form.
export default function ImageUpload({
  label,
  onUploaded,
}: {
  label: string;
  onUploaded: (name: string, originalName: string) => void;
}) {
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (file: File | null) => {
    if (!file) return;
    setError("");
    if (file.size > 2 * 1024 * 1024) {
      setError("Image is too large. Please choose an image under 2 MB.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd, credentials: "same-origin" });
      const data = (await res.json().catch(() => ({}))) as { name?: string; url?: string; error?: string };
      if (!res.ok || !data.name) throw new Error(data.error ?? "Upload failed");
      setPreview(data.url ?? `/api/uploads/${data.name}`);
      onUploaded(data.name, file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="input"
        aria-label={label}
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
      {busy && <p className="mt-1 text-sm text-neutral-600">Uploading…</p>}
      {error && <p className="mt-1 text-sm font-semibold text-red-700" role="alert">{error}</p>}
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Attached crop photo preview" className="mt-2 max-h-44 rounded-lg ring-1 ring-leaf-200" />
      )}
    </div>
  );
}

// Renders a ticket's attached image (file-based or legacy data URL).
export function TicketImage({ imageFile, imageDataUrl, imageName }: { imageFile?: string; imageDataUrl?: string; imageName?: string }) {
  const src = imageFile ? `/api/uploads/${imageFile}` : imageDataUrl;
  if (!src) return null;
  return (
    <figure className="mt-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={imageName ? `Attached photo: ${imageName}` : "Attached crop photo"} className="max-h-52 rounded-lg ring-1 ring-leaf-200" loading="lazy" />
      {imageName && <figcaption className="text-xs text-neutral-500">{imageName}</figcaption>}
    </figure>
  );
}
