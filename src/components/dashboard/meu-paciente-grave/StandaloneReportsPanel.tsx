"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClinicalAssessmentRecord } from "@/lib/types/clinical-assessment";
import { useClinicRealtime } from "@/hooks/useClinicRealtime";

export type StandaloneReport = Pick<
  ClinicalAssessmentRecord,
  | "id"
  | "title"
  | "summary"
  | "vital_signs"
  | "findings"
  | "complementary"
  | "created_at"
>;

type StandaloneReportsPanelProps = {
  embedded?: boolean;
  isOpen?: boolean;
  onViewReport?: (report: StandaloneReport) => void;
};

export default function StandaloneReportsPanel({
  embedded = false,
  isOpen = true,
  onViewReport,
}: StandaloneReportsPanelProps) {
  const [reports, setReports] = useState<StandaloneReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/paciente-grave/t0/avulsos");
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao carregar relatórios avulsos.");
      return;
    }

    setReports(data.reports ?? []);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen, loadReports]);

  useClinicRealtime(loadReports, isOpen);

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      {!embedded && (
        <div className="rounded-lg border border-navy-900/8 bg-white p-6">
          <h2 className="mb-2 text-lg font-medium text-navy-950">
            Relatórios avulsos
          </h2>
          <p className="text-sm text-navy-800/65">
            T0 preenchidas sem paciente vinculado, identificadas pelo título
            definido no momento do salvamento.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div
        className={
          embedded
            ? undefined
            : "rounded-lg border border-navy-900/8 bg-white p-6"
        }
      >
        {!embedded && (
          <h3 className="mb-4 text-sm font-medium text-navy-950">
            T0 avulsas ({reports.length})
          </h3>
        )}

        {loading ? (
          <p className="text-sm text-navy-800/60">Carregando...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-navy-800/60">
            Nenhuma T0 avulsa salva. Marque &quot;T0 avulsa (sem paciente
            vinculado)&quot; e preencha uma avaliação com título.
          </p>
        ) : (
          <ul className="divide-y divide-navy-900/8">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0"
              >
                <div>
                  <p className="font-medium text-navy-950">{report.title}</p>
                  <p className="text-sm text-navy-800/60">
                    {new Date(report.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onViewReport?.(report)}
                  className="rounded-md border border-navy-900/12 px-3 py-1.5 text-xs font-medium text-navy-800 hover:bg-navy-50"
                >
                  Ver laudo
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
