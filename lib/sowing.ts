// Sowing Guide — static curated reference data (package-of-practices
// figures for central India / Madhya Pradesh). This is deliberately NOT
// part of the DB store: it is reference content that must render the
// same on every deploy, including a cold database.

export interface SowingGuide {
  crop: string;
  cropHi: string;
  season: "Kharif" | "Rabi" | "Kharif & Rabi" | "Perennial";
  /** Human-readable sowing window, e.g. "Mid-June to early July". */
  windowText: string;
  /** Months (1-12) in which sowing / transplanting happens — drives the
   *  "Sowing this month" badge on the guide page. */
  months: number[];
  seedRateText: string;
  spacingText: string;
  depthText: string;
  methodText: string;
  tips: string[];
}

export const SOWING_GUIDES: SowingGuide[] = [
  {
    crop: "Soybean",
    cropHi: "सोयाबीन",
    season: "Kharif",
    windowText: "Mid-June to early July, with monsoon onset",
    months: [6, 7],
    seedRateText: "30 kg/acre (75–80 kg/ha)",
    spacingText: "45 cm × 5 cm",
    depthText: "3–5 cm",
    methodText: "Seed drill / dibbling",
    tips: [
      "Treat seed with Rhizobium + PSB culture before sowing for better nodulation and yield.",
      "Sow only after about 100 mm of rain has fallen or the soil has adequate moisture.",
      "Avoid waterlogged patches — soybean cannot tolerate standing water at germination.",
    ],
  },
  {
    crop: "Paddy",
    cropHi: "धान",
    season: "Kharif",
    windowText: "Nursery in June, transplanting in July (direct sowing in June)",
    months: [6, 7],
    seedRateText: "10–12 kg/acre for nursery (25–30 kg/ha); hybrids about 6 kg/acre",
    spacingText: "20 cm × 15 cm (transplanting)",
    depthText: "2–3 cm (direct sowing)",
    methodText: "Transplanting / direct seeding",
    tips: [
      "Transplant 21–25 day old seedlings — older seedlings tiller less.",
      "Plant 2–3 seedlings per hill.",
      "Puddle and level the field well so water stands evenly.",
    ],
  },
  {
    crop: "Wheat",
    cropHi: "गेहूँ",
    season: "Rabi",
    windowText: "November to mid-December (timely sown: November)",
    months: [11, 12],
    seedRateText: "40–50 kg/acre (100–125 kg/ha)",
    spacingText: "22.5 cm between rows",
    depthText: "4–5 cm",
    methodText: "Seed drill",
    tips: [
      "Treat seed before sowing to protect against smut and termites.",
      "Give the first irrigation at the crown-root stage, about 21 days after sowing.",
      "Late sowing (after mid-December) needs a higher seed rate and gives lower yield.",
    ],
  },
  {
    crop: "Cotton",
    cropHi: "कपास",
    season: "Kharif",
    windowText: "May (irrigated) to June (rainfed, with monsoon)",
    months: [5, 6],
    seedRateText: "Bt hybrid: 400–600 g/acre (1–1.5 kg/ha) delinted seed",
    spacingText: "90 cm × 60 cm",
    depthText: "2–3 cm",
    methodText: "Dibbling",
    tips: [
      "Dibble 1–2 seeds per hill and thin to one healthy plant per hill.",
      "For the irrigated crop, give a pre-sowing irrigation for even germination.",
      "Keep the refuge / border rows as per the Bt cotton guidelines on the seed packet.",
    ],
  },
  {
    crop: "Maize",
    cropHi: "मक्का",
    season: "Kharif & Rabi",
    windowText: "Kharif: June–July; Rabi: October–November",
    months: [6, 7, 10, 11],
    seedRateText: "8–10 kg/acre (20–25 kg/ha)",
    spacingText: "60 cm × 20 cm",
    depthText: "3–4 cm",
    methodText: "Dibbling / seed drill",
    tips: [
      "Thin to one plant per hill after germination.",
      "Maize is a heavy feeder — plan the fertilizer dose in splits, not all at sowing.",
      "Avoid waterlogging at germination; ensure field drainage in Kharif.",
    ],
  },
  {
    crop: "Gram (Chana)",
    cropHi: "चना",
    season: "Rabi",
    windowText: "October to mid-November",
    months: [10, 11],
    seedRateText: "Desi: 30 kg/acre (75–80 kg/ha); Kabuli: 40 kg/acre (100 kg/ha)",
    spacingText: "30 cm × 10 cm",
    depthText: "5–8 cm",
    methodText: "Seed drill / dibbling",
    tips: [
      "Treat seed with Rhizobium culture before sowing.",
      "Sow in residual moisture after rice / fallow, or give a pre-sowing irrigation.",
      "Deep sowing (5–8 cm) protects the seed from surface drying in rainfed fields.",
    ],
  },
  {
    crop: "Chilli",
    cropHi: "मिर्च",
    season: "Kharif",
    windowText: "Nursery 6–8 weeks before; transplanting June–July",
    months: [6, 7],
    seedRateText: "200–250 g/acre (500–600 g/ha); hybrids about 100–125 g/acre",
    spacingText: "60 cm × 45 cm",
    depthText: "Nursery seed covered lightly (0.5 cm)",
    methodText: "Nursery + transplanting",
    tips: [
      "Transplant 35–45 day old seedlings, preferably in the evening.",
      "Mulching reduces leaf-curl virus spread by keeping whitefly and thrips down.",
      "Avoid waterlogged nursery beds — seedlings rot quickly.",
    ],
  },
  {
    crop: "Tomato",
    cropHi: "टमाटर",
    season: "Kharif & Rabi",
    windowText: "Kharif transplanting June–July; Rabi September–October",
    months: [6, 7, 9, 10],
    seedRateText: "120–160 g/acre (300–400 g/ha); hybrids 40–50 g/acre",
    spacingText: "60 cm × 45 cm",
    depthText: "Nursery seed 0.5 cm deep",
    methodText: "Nursery + transplanting",
    tips: [
      "Transplant 4–5 week old seedlings.",
      "Stake the plants for better fruit quality and less fruit rot.",
      "Harden the seedlings (reduce water for a few days) before transplanting.",
    ],
  },
  {
    crop: "Onion",
    cropHi: "प्याज़",
    season: "Rabi",
    windowText: "Nursery October–November, transplanting December–January",
    months: [10, 11, 12, 1],
    seedRateText: "3–4 kg/acre (8–10 kg/ha)",
    spacingText: "15 cm × 10 cm",
    depthText: "Transplant seedlings 1–2 cm deep",
    methodText: "Nursery + transplanting (or bulb sets/direct for kharif)",
    tips: [
      "6–8 week old, pencil-thick seedlings are ideal for transplanting.",
      "Use flat beds with light, frequent irrigation.",
      "Cure the bulbs well after harvest before storage.",
    ],
  },
  {
    crop: "Sugarcane",
    cropHi: "गन्ना",
    season: "Perennial",
    windowText: "Autumn planting October–November; spring February–March",
    months: [10, 11, 2, 3],
    seedRateText: "About 30,000 three-budded setts/acre (75,000/ha), roughly 2.5–3 tonnes seed cane/acre",
    spacingText: "90 cm between rows (paired-row 120 cm also used)",
    depthText: "Setts covered with 3–5 cm soil",
    methodText: "Furrow planting of 3-budded setts",
    tips: [
      "Use healthy seed cane from a trusted nursery crop.",
      "Treat setts before planting to protect against red rot and smut.",
      "Trash mulching between rows conserves soil moisture.",
    ],
  },
];
