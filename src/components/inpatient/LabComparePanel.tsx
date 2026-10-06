"use client";

import { computeLabAlerts } from "@/lib/inpatient/lab-alerts";
import { formatLabDayLines } from "@/lib/inpatient/lab-summary";
import type { EpisodeLabValue } from "@/lib/types/inpatient-chart";

type Props = {
  labValues: EpisodeLabValue[];
  onClose: () => void;
};

export default function LabComparePanel({ labValues, onClose }: Props) {
  const lines = formatLabDayLines(labValues);
  const alerts = computeLabAlerts(labValues);
  const trends = alerts.filter((a) => a.kind === "trend");
  const ranges = alerts.filter((a) => a.kind === "range");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-compare-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border border-navy-900/15 bg-white p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <h3 id="lab-compare-title" className="text-sm font-semibold text-navy-950">
            Comparar exames (tendência 2.4)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-navy-800/60 hover:text-navy-950"
          >
            Fechar
          </button>
        </div>
        <p className="mt-2 text-xs text-navy-800/60">
          Cronologia e alertas determinísticos — sem síntese por IA.
        </p>
        {lines.length === 0 ? (
          <p className="mt-4 text-sm text-navy-800/55">Nenhum exame registrado.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm text-navy-900">
            {lines.map((line) => (
              <li key={line} className="rounded border border-navy-900/8 px-3 py-2">
                {line}
              </li>
            ))}
          </ul>
        )}
        {(trends.length > 0 || ranges.length > 0) && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50/80 p-3">
            <p className="text-xs font-medium text-amber-950">Alertas</p>
            <ul className="mt-2 space-y-1 text-xs text-amber-950">
              {[...ranges, ...trends].map((a, i) => (
                <li key={`${a.analyteKey}-${i}`}>• {a.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
