"use client";

import { inr } from "@/lib/money";

// Hand-rolled SVG charts (no chart library): column chart for the revenue
// trend and proportional bars for ranked lists and the order funnel. Every
// chart carries a text alternative via <title> and the surrounding list.

export function ColumnChart({
  data,
  height = 140,
  ariaLabel,
}: {
  data: { label: string; value: number }[];
  height?: number;
  ariaLabel: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 720;
  const gap = 2;
  const bw = Math.max(4, Math.floor((w - gap * (data.length - 1)) / Math.max(1, data.length)));
  return (
    <svg
      viewBox={`0 0 ${w} ${height + 18}`}
      className="w-full"
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
      style={{ minHeight: height }}
    >
      <title>{ariaLabel}</title>
      {data.map((d, i) => {
        const h = Math.max(2, Math.round((d.value / max) * height));
        const x = i * (bw + gap);
        return (
          <g key={d.label + i}>
            <rect x={x} y={height - h} width={bw} height={h} rx={2} className="fill-leaf-500" />
            {i % 5 === 0 && (
              <text x={x + bw / 2} y={height + 13} textAnchor="middle" fontSize="9" className="fill-neutral-500">
                {d.label.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function BarList({
  rows,
  formatValue,
}: {
  rows: { label: string; value: number; sub?: string }[];
  formatValue: (v: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium">{r.label}{r.sub ? <span className="text-neutral-500"> · {r.sub}</span> : null}</span>
            <span className="font-bold">{formatValue(r.value)}</span>
          </div>
          <div className="mt-0.5 h-2.5 rounded-full bg-leaf-100" aria-hidden>
            <div className="h-2.5 rounded-full bg-leaf-500" style={{ width: `${Math.max(3, Math.round((r.value / max) * 100))}%` }} />
          </div>
        </li>
      ))}
      {rows.length === 0 && <li className="text-sm text-neutral-600">No data yet.</li>}
    </ul>
  );
}

export function formatPaiseAsRupees(paise: number): string {
  return inr(paise);
}
