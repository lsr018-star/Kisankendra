"use client";

import { useEffect, useState } from "react";
import { api, fetchMe } from "@/lib/client";
import { useLang } from "@/components/LanguageProvider";
import { VILLAGES } from "@/lib/villages";
import ImageUpload, { TicketImage } from "@/components/ImageUpload";

interface TicketRow {
  id: string;
  type: string;
  crop?: string;
  description: string;
  status: string;
  createdAt: string;
  imageName?: string;
  imageDataUrl?: string;
  imageFile?: string;
  responses: { by: string; text: string; at: string }[];
}

export default function FarmerSupportPage() {
  const { t } = useLang();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    crop: "",
    stage: "",
    village: "Seoni Malwa",
    symptoms: "",
    description: "",
    imageName: "",
    imageFile: "",
  });

  const load = () =>
    api<{ tickets: TicketRow[] }>("/api/tickets").then((r) => setTickets(r.tickets)).catch(() => {});

  useEffect(() => {
    fetchMe().then((r) => {
      if (r?.user) setForm((f) => ({ ...f, name: r.user.name, mobile: r.user.mobile, village: r.user.village ?? f.village }));
    });
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const r = await api<{ ticketNo: string }>("/api/tickets", {
        method: "POST",
        body: JSON.stringify({ ...form, type: "crop" }),
      });
      setMsg(`Request submitted. Ticket number ${r.ticketNo}.`);
      setForm((f) => ({ ...f, crop: "", stage: "", symptoms: "", description: "", imageName: "", imageFile: "" }));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit");
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="card self-start" aria-label="New crop assistance request">
        <h1 className="text-xl font-bold text-leaf-900">{t("support")}</h1>
        <p className="text-sm text-neutral-600">
          Describe the crop problem. An agriculture expert or administrator is assigned to your request. We do
          not provide government officer contact details unless verified and authorised.
        </p>
        <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
          <div>
            <label className="label" htmlFor="sp-crop">{t("crop")}</label>
            <input id="sp-crop" className="input" value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} placeholder="Soybean" />
          </div>
          <div>
            <label className="label" htmlFor="sp-stage">{t("growthStage")}</label>
            <input id="sp-stage" className="input" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="sp-village">{t("village")}</label>
            <select id="sp-village" className="input" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })}>
              {VILLAGES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="sp-sym">{t("symptoms")}</label>
            <input id="sp-sym" className="input" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="sp-desc">{t("description")}</label>
            <textarea id="sp-desc" required className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <ImageUpload
            label={`${t("attachPhoto")} — Photo of affected plant (optional, max 2 MB)`}
            onUploaded={(name, originalName) => setForm((f) => ({ ...f, imageFile: name, imageName: originalName }))}
          />
          {form.imageName && <p className="text-sm text-leaf-700">Attached: {form.imageName}</p>}
          {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
          {msg && <p className="rounded-lg bg-leaf-50 p-3 text-leaf-800" role="status">{msg}</p>}
          <button className="btn-primary" type="submit">{t("submit")}</button>
        </form>
      </section>

      <section className="card self-start" aria-label="My requests">
        <h2 className="text-xl font-bold text-leaf-900">My Requests</h2>
        <ul className="mt-3 space-y-3">
          {tickets.map((tk) => (
            <li key={tk.id} className="rounded-lg ring-1 ring-leaf-100 p-3">
              <p className="flex flex-wrap gap-2">
                <strong>{tk.crop ?? "General"}</strong>
                <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-xs font-bold text-leaf-800">{tk.status}</span>
                <span className="text-xs text-neutral-500">{new Date(tk.createdAt).toLocaleString("en-IN")}</span>
              </p>
              <p className="mt-1 text-sm">{tk.description}</p>
              <TicketImage imageFile={tk.imageFile} imageDataUrl={tk.imageDataUrl} imageName={tk.imageName} />
              {tk.responses.map((r, i) => (
                <p key={i} className="mt-1 rounded bg-cream p-2 text-sm">
                  <strong>{r.by}:</strong> {r.text}
                </p>
              ))}
            </li>
          ))}
          {tickets.length === 0 && <li className="text-neutral-600">No requests yet.</li>}
        </ul>
      </section>
    </div>
  );
}
