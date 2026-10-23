"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useLang } from "@/components/LanguageProvider";
import ProductCard, { type ProductView } from "@/components/ProductCard";
import DiseaseArt from "@/components/DiseaseArt";
import { VILLAGES } from "@/lib/villages";

interface Disease {
  id: string;
  crop: string;
  disease: string;
  symptoms: string;
  causes: string;
  prevention: string;
  tileColor: string;
}

export default function HomePage() {
  const { t } = useLang();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [featured, setFeatured] = useState<ProductView[]>([]);
  const [diseaseQ, setDiseaseQ] = useState("");
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [ticketMsg, setTicketMsg] = useState("");
  const [ticketErr, setTicketErr] = useState("");
  const [ticket, setTicket] = useState({ name: "", mobile: "", crop: "", stage: "", village: "Seoni Malwa", symptoms: "", description: "" });

  useEffect(() => {
    api<{ products: ProductView[] }>("/api/products")
      .then((r) => setFeatured(r.products.slice(0, 4)))
      .catch(() => {});
    api<{ diseases: Disease[] }>("/api/diseases")
      .then((r) => setDiseases(r.diseases))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      api<{ diseases: Disease[] }>(`/api/diseases?q=${encodeURIComponent(diseaseQ)}`)
        .then((r) => setDiseases(r.diseases))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(handle);
  }, [diseaseQ]);

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketMsg("");
    setTicketErr("");
    try {
      const r = await api<{ ticketNo: string }>("/api/tickets", {
        method: "POST",
        body: JSON.stringify({ ...ticket, type: "solution" }),
      });
      setTicketMsg(`Request received. Your ticket number is ${r.ticketNo}. Our agriculture support team will respond.`);
      setTicket({ name: "", mobile: "", crop: "", stage: "", village: "Seoni Malwa", symptoms: "", description: "" });
    } catch (err) {
      setTicketErr(err instanceof Error ? err.message : "Could not submit. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Hero + search */}
      <section className="rounded-2xl bg-leaf-800 px-4 py-8 sm:px-8 text-white">
        <h1 className="text-3xl sm:text-4xl font-extrabold">{t("brand")}</h1>
        <p className="mt-1 text-lg text-leaf-100">{t("tagline")}</p>
        <form
          className="mt-5 flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/catalogue${query ? `?q=${encodeURIComponent(query)}` : ""}`);
          }}
          role="search"
        >
          <label className="sr-only" htmlFor="hero-search">{t("search")}</label>
          <input
            id="hero-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchHint")}
            className="input flex-1 text-neutral-900"
          />
          <button type="submit" className="min-h-[44px] rounded-lg bg-tang-500 px-6 font-bold text-white hover:bg-tang-600">
            {t("search")}
          </button>
        </form>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/login?as=farmer" className="rounded-lg bg-white px-5 py-2.5 font-bold text-leaf-800 min-h-[44px] flex items-center">
            {t("farmerLogin")}
          </Link>
          <Link href="/login?as=shop" className="rounded-lg border-2 border-white px-5 py-2.5 font-bold min-h-[44px] flex items-center">
            {t("shopLogin")}
          </Link>
          <Link href="/register/shop" className="rounded-lg border-2 border-leaf-300 px-5 py-2.5 font-semibold text-leaf-100 min-h-[44px] flex items-center">
            New Shop? Register Here
          </Link>
        </div>
        <p className="mt-2 text-xs text-leaf-200">
          Shop owners — already registered? Use Shop Login. New shop? Register first; selling starts after owner approval.
        </p>
        <p className="mt-4 text-sm text-leaf-200">
          Now serving: {VILLAGES.join(", ")} — Narmadapuram district, Madhya Pradesh.
        </p>
      </section>

      {/* Categories */}
      <section aria-label="Categories">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/catalogue?category=Pesticides" className="card flex items-center gap-4 hover:ring-leaf-400">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-leaf-600 text-2xl font-extrabold text-white">P</span>
            <span>
              <span className="block text-xl font-bold text-leaf-900">{t("pesticides")}</span>
              <span className="text-sm text-neutral-600">Insecticides, fungicides, herbicides and seed treatment from authorised shops.</span>
            </span>
          </Link>
          <Link href="/catalogue?category=Fertilizers" className="card flex items-center gap-4 hover:ring-leaf-400">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tang-500 text-2xl font-extrabold text-white">F</span>
            <span>
              <span className="block text-xl font-bold text-leaf-900">{t("fertilizers")}</span>
              <span className="text-sm text-neutral-600">Urea, DAP, NPK, potash and micronutrients with clear pricing.</span>
            </span>
          </Link>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section aria-label="Featured products">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-leaf-900">Featured Products</h2>
            <Link href="/catalogue" className="font-semibold text-leaf-700 underline">{t("viewProducts")}</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* How it works + delivery */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-bold text-leaf-900">{t("howItWorks")}</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-neutral-700">
            <li>Browse products and add them to your cart.</li>
            <li>Place the order with your village and delivery address.</li>
            <li>Kisankendra assigns the order to an authorised partner shop near you that has the stock.</li>
            <li>The shop confirms, packs and delivers to your home or field.</li>
            <li>Pay cash on delivery, and track every step in My Orders.</li>
          </ol>
        </div>
        <div className="card">
          <h2 className="text-xl font-bold text-leaf-900">{t("deliveryInfo")}</h2>
          <p className="mt-2 text-neutral-700">
            Partner shops deliver to homes and directly to fields in their service villages. Delivery fee and
            taxes are shown clearly before you confirm the order — the price never changes after you place it.
            The selling shop&apos;s name and details appear on your order and invoice.
          </p>
          <h3 className="mt-4 font-bold text-leaf-900">{t("benefits")}</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-neutral-700">
            <li>Farmers: genuine products from licensed local shops, transparent prices, crop help.</li>
            <li>Partner shops: more customers plus a free ERP/CRM for customers, stock and orders.</li>
          </ul>
        </div>
      </section>

      {/* Solution Box */}
      <section className="card" aria-label="Solution Box">
        <h2 className="text-2xl font-bold text-leaf-900">{t("solutionBox")}</h2>
        <p className="text-neutral-700">
          Facing a crop problem? Tell us the crop, stage and symptoms. A support ticket is created and routed to
          our agriculture support team. For a photo, use the Crop Support page after login.
        </p>
        <form onSubmit={submitTicket} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="sb-name">{t("fullName")}</label>
            <input id="sb-name" required className="input" value={ticket.name} onChange={(e) => setTicket({ ...ticket, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="sb-mobile">{t("mobile")}</label>
            <input id="sb-mobile" required inputMode="numeric" className="input" value={ticket.mobile} onChange={(e) => setTicket({ ...ticket, mobile: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="sb-crop">{t("crop")}</label>
            <input id="sb-crop" className="input" value={ticket.crop} onChange={(e) => setTicket({ ...ticket, crop: e.target.value })} placeholder="Soybean" />
          </div>
          <div>
            <label className="label" htmlFor="sb-stage">{t("growthStage")}</label>
            <input id="sb-stage" className="input" value={ticket.stage} onChange={(e) => setTicket({ ...ticket, stage: e.target.value })} placeholder="Flowering" />
          </div>
          <div>
            <label className="label" htmlFor="sb-village">{t("village")}</label>
            <select id="sb-village" className="input" value={ticket.village} onChange={(e) => setTicket({ ...ticket, village: e.target.value })}>
              {VILLAGES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="sb-symptoms">{t("symptoms")}</label>
            <input id="sb-symptoms" className="input" value={ticket.symptoms} onChange={(e) => setTicket({ ...ticket, symptoms: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="sb-desc">{t("description")}</label>
            <textarea id="sb-desc" required className="input" rows={3} value={ticket.description} onChange={(e) => setTicket({ ...ticket, description: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">{t("submit")}</button>
            {ticketMsg && <p className="mt-2 rounded-lg bg-leaf-50 p-3 text-leaf-800" role="status">{ticketMsg}</p>}
            {ticketErr && <p className="mt-2 rounded-lg bg-red-50 p-3 text-red-800" role="alert">{ticketErr}</p>}
          </div>
        </form>
      </section>

      {/* Disease Finder */}
      <section className="card" aria-label="Disease Finder">
        <h2 className="text-2xl font-bold text-leaf-900">{t("diseaseFinder")}</h2>
        <p className="text-neutral-700">
          Search our curated crop disease and pest reference library. This is reference information from reliable
          agricultural sources — <strong>not a definitive diagnosis</strong>. For confirmation, submit a Solution
          Box request or contact your local agriculture department.
        </p>
        <Link
          href="/diseases"
          className="mt-4 flex min-h-[64px] items-center justify-between gap-3 rounded-xl bg-leaf-700 px-5 text-lg font-bold text-white hover:bg-leaf-800"
        >
          <span>Browse by Crop — select your crop, see all its diseases with photos</span>
          <span aria-hidden="true" className="text-2xl">→</span>
        </Link>
        <Link
          href="/sowing"
          className="mt-3 flex min-h-[64px] items-center justify-between gap-3 rounded-xl bg-tang-500 px-5 text-lg font-bold text-white hover:bg-tang-600"
        >
          <span>Sowing Guide — crop-wise sowing time, seed rate &amp; spacing</span>
          <span aria-hidden="true" className="text-2xl">→</span>
        </Link>
        <label className="label mt-4" htmlFor="df-q">Search by crop, disease or symptom</label>
        <input id="df-q" className="input" value={diseaseQ} onChange={(e) => setDiseaseQ(e.target.value)} placeholder="e.g. soybean, rust, yellowing" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {diseases.map((d) => (
            <article key={d.id} className="rounded-xl ring-1 ring-leaf-100 p-4 bg-cream/60">
              <div className="-mx-4 -mt-4 mb-3 overflow-hidden rounded-t-xl">
                <DiseaseArt name={d.disease} symptoms={d.symptoms} color={d.tileColor} />
              </div>
              <h3 className="font-bold text-leaf-900">
                <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: d.tileColor }} aria-hidden="true" />
                {d.crop} — {d.disease}
              </h3>
              <p className="mt-1 text-sm"><strong>{t("symptoms")}:</strong> {d.symptoms}</p>
              <p className="mt-1 text-sm"><strong>Causes:</strong> {d.causes}</p>
              <p className="mt-1 text-sm"><strong>Prevention &amp; management:</strong> {d.prevention}</p>
            </article>
          ))}
          {diseases.length === 0 && <p className="text-neutral-600">{t("noResults")} Try another crop or symptom.</p>}
        </div>
      </section>

      {/* Demo access */}
      <section className="card bg-leaf-50" aria-label="Demo access">
        <h2 className="font-bold text-leaf-900">Try the demo</h2>
        <p className="text-sm text-neutral-700">{t("demoData")}</p>
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          <li>Farmer: mobile <strong>9876543210</strong> / password <strong>farmer123</strong></li>
          <li>Shop A owner: <strong>shopa@kisankendra.in</strong> / <strong>shop123</strong></li>
          <li>Shop B owner: <strong>shopb@kisankendra.in</strong> / <strong>shop123</strong></li>
          <li>Admin: <strong>admin@kisankendra.in</strong> / <strong>admin123</strong></li>
        </ul>
        <p className="mt-2 text-sm">
          Questions? Read the <Link href="/faq" className="underline font-semibold">{t("faq")}</Link> or{" "}
          <Link href="/contact" className="underline font-semibold">{t("contact")}</Link> us.
        </p>
      </section>
    </div>
  );
}
