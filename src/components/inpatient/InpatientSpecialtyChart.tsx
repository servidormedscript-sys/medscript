"use client";

import type { SpecialtyChartRow } from "@/lib/inpatient/specialty-aggregation";
import type { RiskLevel } from "@/lib/types/patient";

const RISK_COLORS: Record<RiskLevel, string> = {
  alto: "bg-red-500",
  medio: "bg-amber-400",
  baixo: "bg-emerald-500",
};

type Props = {
  rows: SpecialtyChartRow[];
  compact?: boolean;
  highlightSpecialty?: string | null;
  onSelectSpecialty?: (key: string | null) => void;
};

export default function InpatientSpecialtyChart({
  rows,
  compact,
  highlightSpecialty,
  onSelectSpecialty,
}: Props) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  if (rows.length === 0) {
    return (
      <p className="text-sm text-navy-800/60">
        Nenhum paciente internado para agrupar por especialidade.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const widthPct = Math.max(8, (row.count / max) * 100);
        const dimmed =
          highlightSpecialty && highlightSpecialty !== row.key ? "opacity-40" : "";
        const selected = highlightSpecialty === row.key;
        return (
          <li key={row.key} className={dimmed}>
            <button
              type="button"
              className={`w-full rounded-md text-left transition-colors ${
                onSelectSpecialty ? "hover:bg-navy-50/80 focus:outline-none focus:ring-2 focus:ring-navy-700/25" : ""
              } ${selected ? "bg-navy-50/90 px-1 -mx-1" : ""}`}
              onClick={() => {
                if (!onSelectSpecialty) return;
                onSelectSpecialty(selected ? null : row.key);
              }}
              disabled={!onSelectSpecialty}
            >
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-navy-950">
                {row.label}
                {row.inferred_count > 0 && !compact && (
                  <span className="ml-1 text-xs font-normal text-navy-800/55">
                    ({row.inferred_count} inferida
                    {row.inferred_count > 1 ? "s" : ""})
                  </span>
                )}
              </span>
              <span className="text-navy-800/70">{row.count}</span>
            </div>
            <div
              className="flex h-3 overflow-hidden rounded-full bg-navy-100"
              title={`Alto ${row.by_risk.alto} · Médio ${row.by_risk.medio} · Baixo ${row.by_risk.baixo}`}
            >
              {(["alto", "medio", "baixo"] as RiskLevel[]).map((risk) => {
                if (row.by_risk[risk] === 0) return null;
                const seg = (row.by_risk[risk] / row.count) * widthPct;
                return (
                  <span
                    key={risk}
                    className={`${RISK_COLORS[risk]} h-full`}
                    style={{ width: `${seg}%` }}
                  />
                );
              })}
              {row.count > 0 &&
                row.by_risk.alto + row.by_risk.medio + row.by_risk.baixo === 0 && (
                  <span
                    className="h-full bg-navy-600"
                    style={{ width: `${widthPct}%` }}
                  />
                )}
            </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
