"use client";

import { getReferenceRange } from "@/lib/inpatient/vital-alerts";
import type { EpisodeVitalRecord } from "@/lib/types/inpatient-chart";

type VitalField = "pas" | "pad" | "fc" | "fr" | "spo2" | "temperature";

const FIELD_LABELS: Record<VitalField, string> = {
  pas: "PAS",
  pad: "PAD",
  fc: "FC",
  fr: "FR",
  spo2: "SpO₂",
  temperature: "Tax",
};

const FIELD_UNITS: Record<VitalField, string> = {
  pas: "mmHg",
  pad: "mmHg",
  fc: "bpm",
  fr: "irpm",
  spo2: "%",
  temperature: "°C",
};

type Props = {
  field: VitalField;
  records: EpisodeVitalRecord[];
  birthDate: string | null;
};

export default function VitalTrendChart({ field, records, birthDate }: Props) {
  const points = records
    .map((r) => ({
      at: new Date(r.recorded_at).getTime(),
      value: r[field] as number | null,
    }))
    .filter((p) => p.value != null)
    .sort((a, b) => a.at - b.at);

  if (points.length === 0) return null;

  const range = getReferenceRange(field, birthDate);
  const values = points.map((p) => p.value as number);
  const minVal = Math.min(...values, range?.min ?? values[0]!);
  const maxVal = Math.max(...values, range?.max ?? values[0]!);
  const padY = (maxVal - minVal) * 0.15 || 5;
  const yMin = minVal - padY;
  const yMax = maxVal + padY;

  const width = 320;
  const height = 120;
  const margin = { top: 12, right: 12, bottom: 20, left: 36 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const xScale = (t: number) => {
    const t0 = points[0]!.at;
    const t1 = points[points.length - 1]!.at;
    if (t1 === t0) return margin.left + innerW / 2;
    return margin.left + ((t - t0) / (t1 - t0)) * innerW;
  };

  const yScale = (v: number) =>
    margin.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.at)} ${yScale(p.value!)}`)
    .join(" ");

  const latest = points[points.length - 1]!;

  let bandY1 = margin.top;
  let bandY2 = margin.top + innerH;
  if (range) {
    bandY1 = yScale(range.max);
    bandY2 = yScale(range.min);
  }

  return (
    <div className="rounded-lg border border-navy-900/8 bg-white p-3">
      <p className="mb-2 text-xs font-medium text-navy-950">
        {FIELD_LABELS[field]} — tendência
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full max-w-md"
        role="img"
        aria-label={`Gráfico de ${FIELD_LABELS[field]}`}
      >
        {range ? (
          <rect
            x={margin.left}
            y={Math.min(bandY1, bandY2)}
            width={innerW}
            height={Math.abs(bandY2 - bandY1)}
            fill="rgb(34 197 94 / 0.12)"
          />
        ) : null}
        <path
          d={path}
          fill="none"
          stroke="rgb(30 58 95)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {points.map((p) => {
          const out =
            range &&
            (p.value! < range.min || p.value! > range.max);
          return (
            <circle
              key={p.at}
              cx={xScale(p.at)}
              cy={yScale(p.value!)}
              r={p.at === latest.at ? 5 : 3.5}
              fill={out ? "rgb(220 38 38)" : "rgb(30 58 95)"}
              stroke="white"
              strokeWidth={p.at === latest.at ? 2 : 1}
            />
          );
        })}
      </svg>
      <p className="mt-1 text-xs text-navy-800/65">
        Último:{" "}
        <span className="font-semibold text-navy-950">
          {latest.value} {FIELD_UNITS[field]}
        </span>
        {range ? (
          <span className="text-navy-800/50">
            {" "}
            · ref. {range.min}–{range.max}
          </span>
        ) : null}
      </p>
    </div>
  );
}
