"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import CropArt from "@/components/CropArt";
import { SOWING_GUIDES, type SowingGuide } from "@/lib/sowing";

// Accent colour per crop for the artwork halo (matches the crop's
// first disease tile colour family in the Disease Finder).
const CROP_COLOR: Record<string, string> = {
  Soybean: "#F9A825",
  Paddy: "#00838F",
  Wheat: "#FB8C00",
  Cotton: "#EC407A",
  Maize: "#3949AB",
  "Gram (Chana)": "#6D4C41",
  Chilli: "#C62828",
  Tomato: "#EF5350",
  Onion: "#7E57C2",
  Sugarcane: "#558B2F",
};

const MONTH_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_HI = [
  "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
];

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-leaf-100 py-3 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-base font-bold text-leaf-900">{label}</dt>
      <dd className="text-base text-neutral-800">{value}</dd>
    </div>
  );
}

function GuideDetail({ g, inSeasonNow }: { g: SowingGuide; inSeasonNow: boolean }) {
  const { lang } = useLang();
  return (
    <article className="card p-5">
      {inSeasonNow && (
        <span className="mb-3 inline-block rounded-full bg-leaf-600 px-3 py-1.5 text-sm font-bold text-white">
          ● {lang === "hi" ? "अभी का सीज़न · बुवाई का समय चल रहा है" : "Sowing now · Abhi ka season"}
        </span>
      )}
      <dl>
        <SpecRow label={lang === "hi" ? "सीज़न" : "Season"} value={g.season} />
        <SpecRow label={lang === "hi" ? "बुवाई का समय" : "Sowing time"} value={g.windowText} />
        <SpecRow label={lang === "hi" ? "बीज की मात्रा" : "Seed rate"} value={g.seedRateText} />
        <SpecRow label={lang === "hi" ? "दूरी" : "Spacing"} value={g.spacingText} />
        <SpecRow label={lang === "hi" ? "गहराई" : "Depth"} value={g.depthText} />
        <SpecRow label={lang === "hi" ? "तरीका" : "Method"} value={g.methodText} />
      </dl>
      <h3 className="mt-4 text-lg font-bold text-leaf-900">{lang === "hi" ? "खास सलाह" : "Tips"}</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-base text-neutral-800">
        {g.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </article>
  );
}

export default function SowingPage() {
  const { t, lang } = useLang();
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  // Current month is computed on the client after mount (1-12), so the
  // "sowing now" badges always reflect the visitor's actual date.
  const [currentMonth, setCurrentMonth] = useState<number | null>(null);

  useEffect(() => {
    setCurrentMonth(new Date().getMonth() + 1);
  }, []);

  const inSeason = useMemo(
    () => SOWING_GUIDES.filter((g) => currentMonth !== null && g.months.includes(currentMonth)),
    [currentMonth]
  );
  const selected = selectedCrop ? SOWING_GUIDES.find((g) => g.crop === selectedCrop) : undefined;
  const monthName = currentMonth ? (lang === "hi" ? MONTH_HI[currentMonth - 1] : MONTH_EN[currentMonth - 1]) : "";

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-3xl font-extrabold text-leaf-900">
          {t("sowingGuide")} {lang === "hi" ? "" : <span className="text-2xl text-neutral-600">· बुवाई गाइड</span>}
        </h1>
        <p className="mt-1 text-neutral-700">
          {lang === "hi"
            ? "पहले अपनी फसल चुनें — बुवाई का सही समय, बीज की मात्रा, दूरी और तरीका एक साथ मिलेगा। ये आंकड़े मध्य भारत / मध्य प्रदेश के लिए हैं।"
            : "First select your crop — its sowing time, seed rate, spacing and method, all in one place. Figures are for central India / Madhya Pradesh."}
        </p>
        <p className="mt-2 rounded-lg bg-leaf-50 p-3 text-sm text-leaf-900">
          These are general recommendations — the actual seed rate varies by variety and field conditions.{" "}
          <strong>Follow local agriculture department / KVK advice</strong> for your exact variety and soil.
        </p>
      </section>

      {currentMonth !== null && !selected && (
        <section aria-label="Sowing this month" className="card bg-leaf-50">
          <h2 className="text-xl font-bold text-leaf-900">
            {lang === "hi" ? `इस महीने बुवाई · ${monthName}` : `Sowing this month · ${monthName}`}
          </h2>
          {inSeason.length > 0 ? (
            <p className="mt-1 text-base text-neutral-800">
              {inSeason.map((g) => `${g.crop} (${g.cropHi})`).join("  ·  ")}
            </p>
          ) : (
            <p className="mt-1 text-base text-neutral-700">
              {lang === "hi"
                ? "इस महीने कोई मुख्य फसल बुवाई पर नहीं है — नीचे सभी फसलों का समय देखें।"
                : "No main crop is sown this month — see the full calendar below."}
            </p>
          )}
        </section>
      )}

      {!selected && (
        <section aria-label="Select your crop">
          <h2 className="mb-3 text-2xl font-bold text-leaf-900">
            Select your crop {lang === "hi" ? "" : <span className="text-lg font-semibold text-neutral-600">· अपनी फसल चुनें</span>}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SOWING_GUIDES.map((g) => {
              const now = currentMonth !== null && g.months.includes(currentMonth);
              return (
                <button
                  key={g.crop}
                  type="button"
                  onClick={() => setSelectedCrop(g.crop)}
                  className="card overflow-hidden p-0 text-left hover:ring-leaf-400 focus:ring-leaf-400"
                  aria-label={`${g.crop} — ${g.season}`}
                >
                  <CropArt crop={g.crop} color={CROP_COLOR[g.crop] ?? "#2E7D32"} />
                  <span className="flex min-h-[64px] items-center justify-between gap-2 p-4">
                    <span>
                      <span className="block text-xl font-bold text-leaf-900">{g.crop}</span>
                      <span className="block text-base text-neutral-600">
                        {g.cropHi} · {g.season}
                      </span>
                    </span>
                    {now && (
                      <span className="shrink-0 rounded-full bg-leaf-600 px-3 py-1.5 text-sm font-bold text-white">
                        ● {lang === "hi" ? "अभी का सीज़न" : "Sowing now"}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {selected && (
        <section aria-label={`${selected.crop} sowing guide`}>
          <button
            type="button"
            onClick={() => setSelectedCrop(null)}
            className="mb-4 min-h-[52px] rounded-lg bg-leaf-700 px-5 font-bold text-white hover:bg-leaf-800"
          >
            ← All Crops
          </button>
          <div className="card mb-4 flex items-center gap-4 overflow-hidden p-0">
            <div className="hidden w-48 shrink-0 sm:block">
              <CropArt crop={selected.crop} color={CROP_COLOR[selected.crop] ?? "#2E7D32"} />
            </div>
            <div className="p-4">
              <h2 className="text-2xl font-bold text-leaf-900">
                {selected.crop}
                <span className="ml-2 text-xl text-neutral-600">{selected.cropHi}</span>
              </h2>
              <p className="text-neutral-700">
                {selected.season} · {selected.windowText}
              </p>
            </div>
          </div>
          <GuideDetail g={selected} inSeasonNow={currentMonth !== null && selected.months.includes(currentMonth)} />
        </section>
      )}
    </div>
  );
}
