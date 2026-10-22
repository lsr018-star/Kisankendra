// "Photo" panel for disease cards, hand-drawn as inline SVG in the same
// style as ProductArt (viewBox 200x112, slice): a field scene with a plant
// whose visible symptom pattern is derived from the disease name/symptoms —
// mosaic patches, rust pustules, concentric blight spots, a drooping wilted
// plant, a larva with chewed holes, a dark rot patch, a black smut whip,
// curled leaves, powdery mildew, or a healthy default leaf. The disease
// tileColor is used as the accent colour.

import { useId } from "react";

export type DiseasePattern =
  | "mosaic"
  | "rust"
  | "spots"
  | "wilt"
  | "worm"
  | "rot"
  | "smut"
  | "curl"
  | "mildew"
  | "default";

export function diseasePattern(name: string, symptoms = ""): DiseasePattern {
  const s = `${name} ${symptoms}`.toLowerCase();
  if (s.includes("smut")) return "smut";
  if (s.includes("mosaic") || s.includes("tungro")) return "mosaic";
  if (s.includes("curl")) return "curl";
  if (s.includes("rust")) return "rust";
  if (s.includes("wilt")) return "wilt";
  if (
    s.includes("worm") ||
    s.includes("borer") ||
    s.includes("beetle") ||
    s.includes("larva") ||
    s.includes("maggot") ||
    s.includes("stem fly")
  )
    return "worm";
  if (s.includes("rot")) return "rot";
  if (s.includes("mildew")) return "mildew";
  if (
    s.includes("spot") ||
    s.includes("blight") ||
    s.includes("anthracnose") ||
    s.includes("blotch") ||
    s.includes("bacterial")
  )
    return "spots";
  return "default";
}

// Leaf shapes of the plant, reused for drawing and for clipping the
// symptom overlays so patterns stay on the leaves.
const LEAF_LEFT = "M100 80 C74 78 58 64 52 40 C78 42 96 58 100 80 Z";
const LEAF_RIGHT = "M100 68 C126 66 142 52 148 28 C122 30 104 46 100 68 Z";
const LEAF_TOP = "M100 48 C90 30 92 12 104 2 C116 14 114 34 100 48 Z";

function Plant({ droop = false }: { droop?: boolean }) {
  if (droop) {
    // Wilted plant: curved stem, leaves hanging down.
    return (
      <g>
        <path d="M100 106 C97 84 92 64 76 48" stroke="#558b2f" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M88 74 C70 78 58 88 54 102 C72 100 84 90 88 74 Z" fill="#7cb342" />
        <path d="M84 58 C98 62 106 72 108 86 C94 82 86 72 84 58 Z" fill="#689f38" />
        <path d="M76 48 C68 36 68 24 74 14 C84 22 84 36 76 48 Z" fill="#8bc34a" />
        <path d="M90 80 C84 88 76 94 66 98" stroke="#33691e" strokeWidth="1.4" fill="none" opacity="0.5" />
      </g>
    );
  }
  return (
    <g>
      <path d="M100 106 L100 44" stroke="#558b2f" strokeWidth="5" strokeLinecap="round" />
      <path d={LEAF_LEFT} fill="#43a047" />
      <path d={LEAF_RIGHT} fill="#388e3c" />
      <path d={LEAF_TOP} fill="#66bb6a" />
      <path d="M98 78 C82 74 68 62 60 46" stroke="#2e7d32" strokeWidth="1.6" fill="none" opacity="0.6" />
      <path d="M102 66 C118 62 132 50 140 34" stroke="#2e7d32" strokeWidth="1.6" fill="none" opacity="0.6" />
    </g>
  );
}

function Spots({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r="8" fill="#4e342e" />
      <circle r="5" fill="#6d4c41" />
      <circle r="2.2" fill="#241611" />
    </g>
  );
}

export default function DiseaseArt({
  name,
  symptoms = "",
  color,
  className = "h-28 w-full",
}: {
  name: string;
  symptoms?: string;
  color: string;
  className?: string;
}) {
  const pattern = diseasePattern(name, symptoms);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `leafclip-${uid}`;
  const bgId = `disbg-${uid}`;

  return (
    <svg
      viewBox="0 0 200 112"
      className={className}
      role="img"
      aria-label={name}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdfaf1" />
          <stop offset="100%" stopColor="#dcedc8" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={LEAF_LEFT} />
          <path d={LEAF_RIGHT} />
          <path d={LEAF_TOP} />
        </clipPath>
      </defs>

      <rect width="200" height="112" fill={`url(#${bgId})`} />
      <circle cx="100" cy="56" r="44" fill={color} opacity="0.14" />
      {/* field rows */}
      <g stroke="#a5c69a" strokeWidth="2" opacity="0.6">
        <path d="M0 100 L200 100" />
        <path d="M20 112 L70 100" />
        <path d="M180 112 L130 100" />
        <path d="M100 112 L100 101" />
      </g>
      <ellipse cx="100" cy="106" rx="52" ry="5" fill="#1b3a1e" opacity="0.12" />

      <Plant droop={pattern === "wilt"} />

      {/* Symptom overlays, clipped to the leaves */}
      <g clipPath={`url(#${clipId})`}>
        {pattern === "mosaic" && (
          <g>
            <ellipse cx="72" cy="56" rx="16" ry="9" fill="#fdd835" opacity="0.85" transform="rotate(-24 72 56)" />
            <ellipse cx="128" cy="44" rx="15" ry="8" fill="#ffee58" opacity="0.85" transform="rotate(20 128 44)" />
            <ellipse cx="102" cy="26" rx="10" ry="6" fill="#fdd835" opacity="0.8" />
            <ellipse cx="86" cy="68" rx="9" ry="5" fill="#c0ca33" opacity="0.7" />
            <ellipse cx="118" cy="58" rx="8" ry="5" fill="#d4e157" opacity="0.8" />
          </g>
        )}
        {pattern === "rust" && (
          <g fill="#e65100">
            {[
              [66, 52], [76, 60], [84, 50], [72, 44], [90, 62],
              [118, 40], [128, 48], [136, 38], [124, 54], [112, 32],
              [100, 22], [106, 32], [96, 14],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 3 : 2.2} fill={i % 2 ? "#bf360c" : "#e65100"} />
            ))}
            <rect x="56" y="64" width="34" height="3" rx="1.5" fill={color} opacity="0.65" transform="rotate(-18 73 65)" />
            <rect x="112" y="56" width="30" height="3" rx="1.5" fill={color} opacity="0.65" transform="rotate(16 127 57)" />
          </g>
        )}
        {pattern === "spots" && (
          <g>
            <Spots x={72} y={54} />
            <Spots x={128} y={42} s={1.15} />
            <Spots x={101} y={24} s={0.8} />
            <Spots x={88} y={68} s={0.7} />
            <Spots x={116} y={58} s={0.65} />
          </g>
        )}
        {pattern === "mildew" && (
          <g fill="#ffffff">
            <ellipse cx="74" cy="54" rx="15" ry="8" opacity="0.9" transform="rotate(-22 74 54)" />
            <ellipse cx="126" cy="44" rx="14" ry="7" opacity="0.85" transform="rotate(18 126 44)" />
            <ellipse cx="101" cy="25" rx="9" ry="5" opacity="0.9" />
            <ellipse cx="90" cy="66" rx="8" ry="4" opacity="0.7" />
            <ellipse cx="116" cy="57" rx="7" ry="4" opacity="0.7" />
          </g>
        )}
        {pattern === "rot" && (
          <g>
            <ellipse cx="78" cy="62" rx="18" ry="11" fill="#3e2723" opacity="0.92" transform="rotate(-20 78 62)" />
            <ellipse cx="128" cy="46" rx="12" ry="8" fill="#4e342e" opacity="0.9" transform="rotate(16 128 46)" />
            <circle cx="72" cy="58" r="3" fill="#1b100c" />
            <circle cx="84" cy="66" r="2.4" fill="#1b100c" />
          </g>
        )}
        {pattern === "worm" && (
          <g>
            {/* chewed holes: punched out in the backdrop colour */}
            <circle cx="70" cy="52" r="5" fill="#eef5e4" />
            <circle cx="84" cy="62" r="4" fill="#eef5e4" />
            <circle cx="130" cy="36" r="4.4" fill="#eef5e4" />
            <circle cx="118" cy="52" r="3.4" fill="#eef5e4" />
          </g>
        )}
        {pattern === "curl" && (
          <g stroke="#2e7d32" strokeWidth="2.4" fill="none" strokeLinecap="round">
            <path d="M54 42 C46 38 46 28 54 26 C61 24 64 31 59 35" />
            <path d="M146 30 C154 26 154 16 146 14 C139 12 136 19 141 23" />
            <path d="M103 6 C98 -1 90 1 90 8 C90 14 97 15 99 10" />
          </g>
        )}
        {pattern === "default" && (
          <g fill="#fff59d">
            <circle cx="74" cy="54" r="3" opacity="0.8" />
            <circle cx="126" cy="44" r="3" opacity="0.8" />
            <circle cx="101" cy="24" r="2.4" opacity="0.8" />
          </g>
        )}
      </g>

      {/* Pattern elements that sit on top of the plant */}
      {pattern === "worm" && (
        <g>
          {/* segmented larva resting on the right leaf */}
          <g transform="rotate(18 128 44)">
            <circle cx="110" cy="44" r="5" fill="#c0ca33" />
            <circle cx="119" cy="45.5" r="5.4" fill="#afb42b" />
            <circle cx="128" cy="46" r="5.4" fill="#c0ca33" />
            <circle cx="137" cy="45" r="5" fill="#afb42b" />
            <circle cx="145" cy="43" r="4.4" fill="#5d4037" />
          </g>
          <circle cx="141" cy="41" r="1.1" fill="#ffffff" />
        </g>
      )}
      {pattern === "rot" && (
        <g>
          {/* rotten fruit hanging at the side */}
          <circle cx="140" cy="86" r="11" fill={color} />
          <circle cx="140" cy="86" r="11" fill="#3e2723" opacity="0.55" />
          <ellipse cx="136" cy="82" rx="6" ry="4" fill="#21120d" opacity="0.85" />
          <path d="M140 75 C140 70 143 67 147 65" stroke="#558b2f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      )}
      {pattern === "smut" && (
        <g>
          {/* black powdery whip replacing the ear/head */}
          <path d="M100 46 C106 28 118 16 136 8" stroke="#212121" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M100 46 C106 28 118 16 136 8" stroke="#424242" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeDasharray="3 5" />
          <g fill="#111111">
            <circle cx="112" cy="26" r="1.8" />
            <circle cx="122" cy="17" r="1.5" />
            <circle cx="104" cy="36" r="1.5" />
            <circle cx="130" cy="11" r="1.8" />
          </g>
        </g>
      )}
      {pattern === "curl" && (
        <g fill="#43a047" stroke="#2e7d32" strokeWidth="1.4">
          {/* a small tightly curled young leaf at the top */}
          <path d="M100 40 C92 32 94 20 103 17 C111 15 115 22 110 27 C106 30 101 27 103 22" fill="none" strokeWidth="2.6" />
        </g>
      )}

      {/* accent band, ties the panel to the disease tile colour */}
      <rect x="0" y="108" width="200" height="4" fill={color} />
    </svg>
  );
}
