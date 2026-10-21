// Packshot-style product artwork, hand-drawn as inline SVG. One consistent
// brand system: soft field backdrop, ground shadow, the pack rendered in
// the product's tile colour with a cream label and a leaf emblem. The pack
// shape follows the product type (keyword in the name, category fallback):
// fertilizer sack, seed packet, herbicide jug, fungicide bottle, spray
// bottle for insecticides/oils/treatments.

type Variant = "sack" | "packet" | "jug" | "bottle" | "spray";

export function artVariant(name: string, category: string): Variant {
  const n = name.toLowerCase();
  if (n.includes("seed")) return "packet";
  if (category === "Fertilizers") return "sack";
  if (n.includes("herbicide")) return "jug";
  if (n.includes("fungicide")) return "bottle";
  return "spray";
}

function Leaf({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 10 C -8 2, -6 -8, 4 -12 C 12 -6, 10 6, 0 10 Z" fill="#2e7d32" />
      <path d="M-4 6 C -1 1, 3 -4, 7 -8" stroke="#f7f3e8" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Label({ x, y, w, h, lines = 2 }: { x: number; y: number; w: number; h: number; lines?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} fill="#fbf7ec" />
      <Leaf x={x + w / 2} y={y + h / 2 - 2} s={0.9} />
      {Array.from({ length: lines }).map((_, i) => (
        <rect key={i} x={x + 6} y={y + h - 9 + i * 0} width={w - 12} height={0} fill="none" />
      ))}
      <rect x={x + 7} y={y + h - 8} width={w - 14} height={2.4} rx={1.2} fill="#c9d6c5" />
    </g>
  );
}

export default function ProductArt({
  name,
  category,
  color,
}: {
  name: string;
  category: string;
  color: string;
}) {
  const v = artVariant(name, category);
  const dark = "#00000033";
  return (
    <svg viewBox="0 0 200 112" className="h-28 w-full" role="img" aria-label={name} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`bg-${v}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdfaf1" />
          <stop offset="100%" stopColor="#e8f2e4" />
        </linearGradient>
      </defs>
      <rect width="200" height="112" fill={`url(#bg-${v})`} />
      <circle cx="100" cy="52" r="40" fill="#ffffff" opacity="0.55" />
      <ellipse cx="100" cy="98" rx="46" ry="6" fill="#1b3a1e" opacity="0.12" />

      {v === "sack" && (
        <g>
          <path d="M62 30 L138 30 L146 96 Q146 100 142 100 L58 100 Q54 100 54 96 Z" fill={color} />
          <path d="M62 30 L138 30 L140 42 L60 42 Z" fill={dark} />
          <path d="M60 34 H140" stroke="#fbf7ec" strokeWidth="2" strokeDasharray="5 4" opacity="0.8" />
          <Label x={72} y={50} w={56} h={38} />
        </g>
      )}

      {v === "packet" && (
        <g>
          <rect x="66" y="22" width="68" height="78" rx="4" fill={color} />
          <path d="M66 26 Q100 16 134 26 L134 36 Q100 26 66 36 Z" fill={dark} />
          <Label x={76} y={44} w={48} h={34} />
          <circle cx="100" cy="90" r="4" fill="#fbf7ec" opacity="0.85" />
        </g>
      )}

      {v === "jug" && (
        <g>
          <path d="M84 26 h26 v8 h-26 Z" fill="#37474f" />
          <path d="M70 40 Q70 34 76 34 h44 q6 0 6 6 v10 q14 4 14 16 v28 q0 6 -6 6 H66 q-6 0 -6 -6 V50 q0 -8 10 -10 Z" fill={color} />
          <path d="M126 44 q16 6 16 20" stroke={color} strokeWidth="7" fill="none" strokeLinecap="round" />
          <Label x={72} y={56} w={52} h={34} />
        </g>
      )}

      {v === "bottle" && (
        <g>
          <rect x="88" y="16" width="24" height="10" rx="2" fill="#37474f" />
          <path d="M90 26 h20 v8 q10 4 10 14 v46 q0 6 -6 6 H86 q-6 0 -6 -6 V48 q0 -10 10 -14 Z" fill={color} />
          <path d="M80 52 h40" stroke={dark} strokeWidth="3" />
          <Label x={84} y={58} w={32} h={30} />
        </g>
      )}

      {v === "spray" && (
        <g>
          <path d="M78 22 h30 l14 6 v6 H92 v6 H78 Z" fill="#37474f" />
          <rect x="118" y="26" width="16" height="5" rx="2" fill="#37474f" />
          <path d="M84 40 h24 q6 0 6 6 v48 q0 6 -6 6 H84 q-6 0 -6 -6 V46 q0 -6 6 -6 Z" fill={color} />
          <path d="M78 50 h36" stroke={dark} strokeWidth="3" />
          <Label x={82} y={56} w={28} h={30} />
          <g stroke="#90a4ae" strokeWidth="2" strokeLinecap="round" opacity="0.8">
            <path d="M140 24 l12 -5" />
            <path d="M141 30 l13 0" />
            <path d="M140 36 l12 5" />
          </g>
        </g>
      )}
    </svg>
  );
}
