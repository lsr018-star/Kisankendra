"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import AdminNav from "@/components/AdminNav";

interface TicketRow {
  id: string;
  type: string;
  name: string;
  mobile: string;
  crop?: string;
  village?: string;
  symptoms?: string;
  description: string;
  status: string;
  assignedTo?: string;
  imageName?: string;
  createdAt: string;
  responses: { by: string; text: string; at: string }[];
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [assignee, setAssignee] = useState<Record<string, string>>({});

  const load = () =>
    api<{ tickets: TicketRow[] }>("/api/admin/tickets").then((r) => setTickets(r.tickets)).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const patch = async (id: string, body: Record<string, unknown>) => {
    await api("/api/admin/tickets", { method: "PATCH", body: JSON.stringify({ id, ...body }) });
    load();
  };

  return (
    <div>
      <AdminNav />
      <h2 className="text-lg font-bold text-leaf-900">Support Tickets & Crop Assistance</h2>
      <div className="mt-3 flex flex-col gap-3">
        {tickets.map((tk) => (
          <article key={tk.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{tk.crop ?? "General support"}</strong>
              <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-semibold">{tk.type}</span>
              <span className="rounded-full bg-leaf-100 px-2.5 py-0.5 text-xs font-bold text-leaf-800">{tk.status}</span>
              <span className="text-sm text-neutral-500">{new Date(tk.createdAt).toLocaleString("en-IN")}</span>
              {tk.assignedTo && <span className="text-sm">Assigned: <strong>{tk.assignedTo}</strong></span>}
            </div>
            <p className="mt-1 text-sm">
              {tk.name} · {tk.mobile}{tk.village ? ` · ${tk.village}` : ""}
              {tk.symptoms ? <><br />Symptoms: {tk.symptoms}</> : null}
            </p>
            <p className="mt-1">{tk.description}</p>
            {tk.imageName && <p className="text-sm text-neutral-600">Attached image: {tk.imageName}</p>}
            {tk.responses.map((r, i) => (
              <p key={i} className="mt-1 rounded bg-cream p-2 text-sm"><strong>{r.by}:</strong> {r.text}</p>
            ))}
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="sr-only" htmlFor={`rp-${tk.id}`}>Reply</label>
              <input
                id={`rp-${tk.id}`}
                className="input min-w-[220px] flex-1"
                placeholder="Write a response…"
                value={reply[tk.id] ?? ""}
                onChange={(e) => setReply({ ...reply, [tk.id]: e.target.value })}
              />
              <button className="btn-primary" onClick={() => patch(tk.id, { response: reply[tk.id] ?? "" })}>Respond</button>
              <label className="sr-only" htmlFor={`as-${tk.id}`}>Assign to expert</label>
              <input
                id={`as-${tk.id}`}
                className="input w-52"
                placeholder="Assign to (expert name)"
                value={assignee[tk.id] ?? tk.assignedTo ?? ""}
                onChange={(e) => setAssignee({ ...assignee, [tk.id]: e.target.value })}
              />
              <button className="btn-secondary" onClick={() => patch(tk.id, { assignedTo: assignee[tk.id] ?? "" })}>Assign</button>
              {tk.status !== "Closed" && (
                <button className="btn-danger" onClick={() => patch(tk.id, { status: "Closed" })}>Close</button>
              )}
            </div>
          </article>
        ))}
        {tickets.length === 0 && <div className="card text-center text-neutral-600">No tickets yet.</div>}
      </div>
    </div>
  );
}
