// Shared crop motif artwork in the same SVG style as ProductArt /
// DiseaseArt: a field scene with the crop's recognisable feature
// (pods, grain head, ear, bolls, cob, chillies, fruits, bulb, canes).
// Used by the Disease Finder and the Sowing Guide crop grids.
export default function CropArt({ crop, color }: { crop: string; color: string }) {
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
