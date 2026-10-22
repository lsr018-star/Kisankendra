"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { useLang } from "@/components/LanguageProvider";
import DiseaseArt from "@/components/DiseaseArt";
import CropArt from "@/components/CropArt";

interface Disease {
  id: string;
  crop: string;
  disease: string;
  symptoms: string;
  causes: string;
  prevention: string;
  tileColor: string;
}

// Crop name in Hindi, shown alongside the English name on every card.
const CROP_HI: Record<string, string> = {
  Soybean: "सोयाबीन",
  Paddy: "धान",
  Wheat: "गेहूँ",
  Cotton: "कपास",
  Maize: "मक्का",
  "Gram (Chana)": "चना",
  Chilli: "मिर्च",
  Tomato: "टमाटर",
  Onion: "प्याज़",
  Sugarcane: "गन्ना",
};

function DiseaseCard({ d, showCrop }: { d: Disease; showCrop?: boolean }) {
  const { t } = useLang();
  return (
    <article className="card overflow-hidden p-0">
      <DiseaseArt name={d.disease} symptoms={d.symptoms} color={d.tileColor} className="h-36 w-full" />
      <div className="p-4">
        <h3 className="text-lg font-bold text-leaf-900">{d.disease}</h3>
        {showCrop && (
          <p className="text-sm font-semibold text-leaf-700">
            {d.crop}
            {CROP_HI[d.crop] ? ` · ${CROP_HI[d.crop]}` : ""}
          </p>
        )}
        <p className="mt-1 text-sm">
          <strong>{t("symptoms")}:</strong> {d.symptoms}
        </p>
        <p className="mt-1 text-sm">
          <strong>Causes:</strong> {d.causes}
        </p>
        <p className="mt-1 text-sm">
          <strong>Prevention &amp; management:</strong> {d.prevention}
        </p>
      </div>
    </article>
  );
}

export default function DiseasesPage() {
  const { t, lang } = useLang();
  const [all, setAll] = useState<Disease[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api<{ diseases: Disease[] }>("/api/diseases")
      .then((r) => setAll(r.diseases))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const crops = useMemo(() => {
    const map = new Map<string, Disease[]>();
    for (const d of all) {
      const list = map.get(d.crop) ?? [];
      list.push(d);
      map.set(d.crop, list);
    }
    return [...map.entries()]
      .map(([crop, list]) => ({ crop, list, count: list.length, color: list[0]?.tileColor ?? "#2E7D32" }))
      .sort((a, b) => a.crop.localeCompare(b.crop));
  }, [all]);

  const query = q.trim().toLowerCase();
  const matches = query
    ? all.filter(
        (d) =>
          d.crop.toLowerCase().includes(query) ||
          d.disease.toLowerCase().includes(query) ||
          d.symptoms.toLowerCase().includes(query) ||
          d.causes.toLowerCase().includes(query)
      )
    : [];

  const selected = selectedCrop ? crops.find((c) => c.crop === selectedCrop) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-3xl font-extrabold text-leaf-900">{t("diseaseFinder")}</h1>
        <p className="mt-1 text-neutral-700">
          {lang === "hi"
            ? "पहले अपनी फसल चुनें — उस फसल के सभी रोग, उनके लक्षण और बचाव एक साथ फोटो के साथ दिखेंगे।"
            : "First select your crop — all its diseases and pests will appear together with pictures, symptoms and prevention."}
        </p>
        <p className="mt-2 rounded-lg bg-leaf-50 p-3 text-sm text-leaf-900">
          This library is reference information from reliable agricultural sources —{" "}
          <strong>not a definitive diagnosis</strong>. For confirmation, submit a Solution Box request on the
          home page or contact your local agriculture department.
        </p>
        <label className="label mt-4" htmlFor="dis-q">
          Search by crop, disease or symptom
        </label>
        <input
          id="dis-q"
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. soybean, rust, yellowing"
        />
      </section>

      {!loaded && <p className="text-neutral-600">Loading…</p>}

      {loaded && query && (
        <section aria-label="Search results">
          <h2 className="mb-3 text-2xl font-bold text-leaf-900">
            {matches.length} {matches.length === 1 ? "result" : "results"} for &ldquo;{q.trim()}&rdquo;
          </h2>
          {matches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {matches.map((d) => (
                <DiseaseCard key={d.id} d={d} showCrop />
              ))}
            </div>
          ) : (
            <p className="text-neutral-600">{t("noResults")} Try another crop or symptom.</p>
          )}
        </section>
      )}

      {loaded && !query && !selected && (
        <section aria-label="Select your crop">
          <h2 className="mb-3 text-2xl font-bold text-leaf-900">
            Select your crop {lang === "hi" ? "" : <span className="text-lg font-semibold text-neutral-600">· अपनी फसल चुनें</span>}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {crops.map(({ crop, count, color }) => (
              <button
                key={crop}
                type="button"
                onClick={() => setSelectedCrop(crop)}
                className="card overflow-hidden p-0 text-left hover:ring-leaf-400 focus:ring-leaf-400"
                aria-label={`${crop} — ${count} diseases`}
              >
                <CropArt crop={crop} color={color} />
                <span className="flex min-h-[64px] items-center justify-between gap-2 p-4">
                  <span>
                    <span className="block text-xl font-bold text-leaf-900">{crop}</span>
                    {CROP_HI[crop] && <span className="block text-base text-neutral-600">{CROP_HI[crop]}</span>}
                  </span>
                  <span className="shrink-0 rounded-full bg-leaf-600 px-3 py-1.5 text-sm font-bold text-white">
                    {count} {count === 1 ? "disease" : "diseases"}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {crops.length === 0 && <p className="text-neutral-600">{t("noResults")}</p>}
        </section>
      )}

      {loaded && !query && selected && (
        <section aria-label={`${selected.crop} diseases`}>
          <button
            type="button"
            onClick={() => setSelectedCrop(null)}
            className="mb-4 min-h-[52px] rounded-lg bg-leaf-700 px-5 font-bold text-white hover:bg-leaf-800"
          >
            ← All Crops
          </button>
          <div className="card mb-4 flex items-center gap-4 overflow-hidden p-0">
            <div className="hidden w-48 shrink-0 sm:block">
              <CropArt crop={selected.crop} color={selected.color} />
            </div>
            <div className="p-4">
              <h2 className="text-2xl font-bold text-leaf-900">
                {selected.crop}
                {CROP_HI[selected.crop] && <span className="ml-2 text-xl text-neutral-600">{CROP_HI[selected.crop]}</span>}
              </h2>
              <p className="text-neutral-700">
                {selected.count} {selected.count === 1 ? "disease" : "diseases"} &amp; pests in the reference library.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {selected.list.map((d) => (
              <DiseaseCard key={d.id} d={d} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
