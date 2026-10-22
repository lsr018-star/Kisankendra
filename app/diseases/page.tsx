"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { useLang } from "@/components/LanguageProvider";
import DiseaseArt from "@/components/DiseaseArt";

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

// Small crop motif artwork in the same SVG style as ProductArt /
// DiseaseArt: a field scene with the crop's recognisable feature
// (pods, grain head, ear, bolls, cob, chillies, fruits, bulb, canes).
function CropArt({ crop, color }: { crop: string; color: string }) {
  return (
    <svg viewBox="0 0 200 112" className="h-28 w-full" role="img" aria-label={crop} preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="112" fill="#eef5e4" />
      <circle cx="100" cy="54" r="42" fill={color} opacity="0.15" />
      <ellipse cx="100" cy="103" rx="58" ry="6" fill="#1b3a1e" opacity="0.12" />
      <rect x="0" y="100" width="200" height="12" fill="#c5d8b8" />

      {crop === "Soybean" && (
        <g>
          <path d="M100 100 L100 34" stroke="#558b2f" strokeWidth="5" strokeLinecap="round" />
          <path d="M100 62 C78 60 66 50 60 34 C82 36 96 46 100 62 Z" fill="#43a047" />
          <path d="M100 52 C122 50 134 40 140 24 C118 26 104 36 100 52 Z" fill="#388e3c" />
          <g fill="#aed581" stroke="#7cb342" strokeWidth="1.4">
            <ellipse cx="82" cy="76" rx="5" ry="11" transform="rotate(18 82 76)" />
            <ellipse cx="118" cy="72" rx="5" ry="11" transform="rotate(-18 118 72)" />
            <ellipse cx="100" cy="84" rx="5" ry="11" />
          </g>
        </g>
      )}
      {crop === "Paddy" && (
        <g stroke="#7cb342" strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M78 100 C78 70 76 48 70 28" />
          <path d="M100 100 L100 22" />
          <path d="M122 100 C122 70 124 48 130 28" />
        </g>
      )}
      {crop === "Paddy" && (
        <g fill="#d4a017">
          {[70, 100, 130].map((x) => (
            <g key={x}>
              <ellipse cx={x - 6} cy={20} rx="3" ry="6" transform={`rotate(-24 ${x - 6} 20)`} />
              <ellipse cx={x + 6} cy={20} rx="3" ry="6" transform={`rotate(24 ${x + 6} 20)`} />
              <ellipse cx={x} cy={27} rx="3" ry="6" />
            </g>
          ))}
        </g>
      )}
      {crop === "Wheat" && (
        <g>
          {[74, 100, 126].map((x) => (
            <g key={x}>
              <path d={`M${x} 100 L${x} 44`} stroke="#c08a1e" strokeWidth="3.4" strokeLinecap="round" />
              <g fill="#e0aa3e">
                {[0, 1, 2, 3].map((i) => (
                  <g key={i}>
                    <ellipse cx={x - 5} cy={40 - i * 8} rx="3" ry="6" transform={`rotate(-28 ${x - 5} ${40 - i * 8})`} />
                    <ellipse cx={x + 5} cy={40 - i * 8} rx="3" ry="6" transform={`rotate(28 ${x + 5} ${40 - i * 8})`} />
                  </g>
                ))}
                <ellipse cx={x} cy={10} rx="2.6" ry="6" />
              </g>
            </g>
          ))}
        </g>
      )}
      {crop === "Cotton" && (
        <g>
          <path d="M100 100 L100 40 M100 66 C84 62 74 54 68 42 M100 58 C116 54 126 46 132 34" stroke="#6d4c41" strokeWidth="4" fill="none" strokeLinecap="round" />
          {[
            [66, 38],
            [134, 30],
            [100, 34],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <path d={`M${cx - 8} ${cy + 8} L${cx} ${cy - 2} L${cx + 8} ${cy + 8} L${cx} ${cy + 4} Z`} fill="#795548" />
              <circle cx={cx} cy={cy} r="9" fill="#ffffff" />
              <circle cx={cx - 5} cy={cy + 4} r="6" fill="#f5f5f5" />
              <circle cx={cx + 5} cy={cy + 4} r="6" fill="#fafafa" />
            </g>
          ))}
        </g>
      )}
      {crop === "Maize" && (
        <g>
          <path d="M100 102 L100 16" stroke="#558b2f" strokeWidth="6" strokeLinecap="round" />
          <path d="M100 58 C74 56 60 44 54 24 C80 26 96 40 100 58 Z" fill="#43a047" />
          <path d="M100 44 C126 42 140 30 146 12 C120 14 104 28 100 44 Z" fill="#388e3c" />
          <g transform="rotate(24 118 66)">
            <rect x="110" y="48" width="16" height="36" rx="8" fill="#f9a825" />
            <g fill="#f57f17">
              <circle cx="115" cy="56" r="1.6" /><circle cx="121" cy="56" r="1.6" />
              <circle cx="115" cy="64" r="1.6" /><circle cx="121" cy="64" r="1.6" />
              <circle cx="115" cy="72" r="1.6" /><circle cx="121" cy="72" r="1.6" />
            </g>
          </g>
        </g>
      )}
      {crop === "Gram (Chana)" && (
        <g>
          <path d="M100 100 C100 78 98 62 92 46 M100 100 C104 80 110 64 120 50 M100 100 C94 82 86 70 74 60" stroke="#558b2f" strokeWidth="4" fill="none" strokeLinecap="round" />
          <g fill="#66bb6a">
            <circle cx="78" cy="52" r="12" />
            <circle cx="100" cy="40" r="13" />
            <circle cx="122" cy="52" r="12" />
          </g>
          <g fill="#d7ccc8" stroke="#a1887f" strokeWidth="1.2">
            <ellipse cx="86" cy="70" rx="4.4" ry="8" transform="rotate(16 86 70)" />
            <ellipse cx="112" cy="66" rx="4.4" ry="8" transform="rotate(-16 112 66)" />
            <ellipse cx="100" cy="78" rx="4.4" ry="8" />
          </g>
        </g>
      )}
      {crop === "Chilli" && (
        <g>
          <path d="M100 100 L100 36 M100 62 C80 60 68 50 62 36 M100 54 C120 52 132 42 138 28" stroke="#558b2f" strokeWidth="4.4" fill="none" strokeLinecap="round" />
          <g fill="#43a047">
            <circle cx="72" cy="44" r="11" />
            <circle cx="128" cy="38" r="11" />
            <circle cx="100" cy="30" r="10" />
          </g>
          <g fill="#d32f2f">
            <path d="M76 62 C70 74 72 84 80 90 C84 80 84 70 76 62 Z" />
            <path d="M122 56 C116 68 118 78 126 84 C130 74 130 64 122 56 Z" />
            <path d="M100 66 C94 76 96 86 103 91 C107 82 107 73 100 66 Z" />
          </g>
        </g>
      )}
      {crop === "Tomato" && (
        <g>
          <path d="M100 100 L100 34 M100 64 C80 62 68 52 62 38 M100 56 C120 54 132 44 138 30" stroke="#558b2f" strokeWidth="4.4" fill="none" strokeLinecap="round" />
          <g fill="#43a047">
            <circle cx="72" cy="42" r="11" />
            <circle cx="128" cy="36" r="11" />
          </g>
          <g>
            <circle cx="80" cy="72" r="11" fill="#e53935" />
            <circle cx="120" cy="66" r="12" fill="#d32f2f" />
            <circle cx="100" cy="84" r="10" fill="#ef5350" />
            <g fill="#2e7d32">
              <path d="M80 61 l3 5 -6 0 Z" />
              <path d="M120 54 l3 5 -6 0 Z" />
              <path d="M100 73 l3 5 -6 0 Z" />
            </g>
          </g>
        </g>
      )}
      {crop === "Onion" && (
        <g stroke="#66bb6a" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M88 62 C84 44 80 30 72 18" />
          <path d="M100 60 L100 12" />
          <path d="M112 62 C116 44 120 30 128 18" />
        </g>
      )}
      {crop === "Onion" && (
        <g>
          <path d="M100 58 C118 58 126 72 126 84 C126 97 115 103 100 103 C85 103 74 97 74 84 C74 72 82 58 100 58 Z" fill="#8e24aa" />
          <path d="M90 62 C84 72 84 90 90 100 M110 62 C116 72 116 90 110 100" stroke="#ba68c8" strokeWidth="2.4" fill="none" />
          <path d="M92 103 C95 107 98 108 100 110 M108 103 C105 107 102 108 100 110" stroke="#a1887f" strokeWidth="2" fill="none" />
        </g>
      )}
      {crop === "Sugarcane" && (
        <g>
          {[76, 100, 124].map((x, i) => (
            <g key={x}>
              <rect x={x - 7} y={18 + i * 4} width="14" height="84" rx="6" fill={i === 1 ? "#7cb342" : "#689f38"} />
              <rect x={x - 7} y={42 + i * 4} width="14" height="4" fill="#558b2f" />
              <rect x={x - 7} y={66 + i * 4} width="14" height="4" fill="#558b2f" />
              <path d={`M${x} ${18 + i * 4} C ${x - 16} ${8 + i * 2}, ${x - 24} ${12 + i * 2}, ${x - 30} ${2 + i * 2}`} stroke="#43a047" strokeWidth="3.4" fill="none" strokeLinecap="round" />
              <path d={`M${x} ${18 + i * 4} C ${x + 16} ${8 + i * 2}, ${x + 24} ${12 + i * 2}, ${x + 30} ${2 + i * 2}`} stroke="#66bb6a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
            </g>
          ))}
        </g>
      )}
      {!["Soybean", "Paddy", "Wheat", "Cotton", "Maize", "Gram (Chana)", "Chilli", "Tomato", "Onion", "Sugarcane"].includes(crop) && (
        <g>
          <path d="M100 102 L100 44" stroke="#558b2f" strokeWidth="5" strokeLinecap="round" />
          <path d="M100 80 C74 78 58 64 52 40 C78 42 96 58 100 80 Z" fill="#43a047" />
          <path d="M100 68 C126 66 142 52 148 28 C122 30 104 46 100 68 Z" fill="#388e3c" />
        </g>
      )}
    </svg>
  );
}

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
