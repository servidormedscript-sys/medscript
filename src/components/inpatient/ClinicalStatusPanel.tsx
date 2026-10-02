"use client";

import type { ClinicalStatusResult } from "@/lib/inpatient/clinical-status";
import { RISK_LABELS } from "@/lib/types/patient";

const RISK_BADGE: Record<string, string> = {
  alto: "bg-red-100 text-red-800 border-red-200",
  medio: "bg-amber-100 text-amber-900 border-amber-200",
  baixo: "bg-emerald-100 text-emerald-900 border-emerald-200",
};

type Props = {
  status: ClinicalStatusResult;
  compact?: boolean;
};

export default function ClinicalStatusPanel({ status, compact }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${RISK_BADGE[status.risk]}`}
        >
          Risco: {RISK_LABELS[status.risk]}
        </span>
        <span className="text-sm font-medium text-navy-950">
          Critérios de alta: {status.discharge.met}/{status.discharge.total}
        </span>
      </div>

      {status.evolutionDelayAlert !== "none" && (
        <p
          className={`text-sm ${
            status.evolutionDelayAlert === "high"
              ? "text-red-800"
              : "text-amber-900"
          }`}
          role="alert"
        >
          {status.evolutionDelayAlert === "high"
            ? "⚠ Evolução atrasada ≥24h"
            : "⚠ Evolução atrasada ≥12h"}
        </p>
      )}

      {!compact && status.riskReasons.length > 0 && (
        <div className="rounded-md border border-navy-900/8 bg-navy-50/50 p-3">
          <p className="text-xs font-medium text-navy-800/55">
            Motivos da classificação
          </p>
          <ul className="mt-1 space-y-0.5 text-sm text-navy-900">
            {status.riskReasons.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-md border border-navy-900/8 bg-white p-3">
        <p className="text-xs font-medium text-navy-800/55">Critérios de alta</p>
        <ul className="mt-2 space-y-2">
          {status.discharge.criteria.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-medium">
                {c.met ? "✅" : "⬜"} {c.label}
              </span>
              {!compact && (
                <p className="text-xs text-navy-800/60">{c.detail}</p>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-navy-800/50">
          {status.discharge.disclaimer}
        </p>
      </div>
    </div>
  );
}
