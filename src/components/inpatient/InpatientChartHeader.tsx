"use client";

import { computeInternationDay } from "@/lib/inpatient/internation-day";
import type { ClinicalStatusResult } from "@/lib/inpatient/clinical-status";
import type { CodeStatus } from "@/lib/inpatient/code-status";
import CodeStatusBadge from "@/components/inpatient/CodeStatusBadge";
import { RISK_LABELS, SEX_LABELS, type RiskLevel } from "@/lib/types/patient";
import type { Patient, PatientEpisode } from "@/lib/types/patient";
import { formatAge } from "@/lib/utils/age";

type Props = {
  episode: PatientEpisode;
  patient: Patient;
  clinicalStatus?: ClinicalStatusResult | null;
  codeStatus?: CodeStatus | null;
};

const RISK_BADGE: Record<string, string> = {
  alto: "bg-red-100 text-red-800 border-red-200",
  medio: "bg-amber-100 text-amber-900 border-amber-200",
  baixo: "bg-emerald-100 text-emerald-900 border-emerald-200",
};

export default function InpatientChartHeader({
  episode,
  patient,
  clinicalStatus,
  codeStatus,
}: Props) {
  const displayRisk: RiskLevel | null =
    clinicalStatus?.risk ?? episode.risk_level ?? null;
  const day = computeInternationDay(episode);
  const age = patient.birth_date ? formatAge(patient.birth_date) : null;
  const sex = patient.sex ? SEX_LABELS[patient.sex] : null;
  const meta = [age, sex, episode.weight ? `${episode.weight} kg` : null]
    .filter(Boolean)
    .join(" · ");

  const admissionDate = new Date(episode.created_at).toLocaleDateString("pt-BR");

  return (
    <header className="border-b border-navy-900/10 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-navy-950 sm:text-2xl">
            {patient.full_name}
          </h1>
          <p className="mt-1 text-sm text-navy-800/70">
            {episode.bed ? `Leito ${episode.bed}` : "Leito não informado"}
            {meta ? ` · ${meta}` : ""}
          </p>
          <p className="mt-1 text-sm text-navy-800/65">
            Internado(a) desde {admissionDate} · {day}º dia de internação
          </p>
          {episode.diagnosis?.trim() && (
            <p className="mt-2 text-sm text-navy-950">
              <span className="font-medium">Diagnóstico:</span>{" "}
              {episode.diagnosis}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {displayRisk && (
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${RISK_BADGE[displayRisk] ?? "bg-navy-100 text-navy-900"}`}
              title="Classificação dinâmica (vitais, exames, evolução)"
            >
              Risco: {RISK_LABELS[displayRisk]}
            </span>
          )}
          {clinicalStatus && (
            <span className="rounded-full border border-navy-900/12 bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-900">
              Alta {clinicalStatus.discharge.met}/{clinicalStatus.discharge.total}
            </span>
          )}
          {codeStatus && <CodeStatusBadge status={codeStatus} />}
        </div>
      </div>

      {episode.allergies?.trim() && (
        <div
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
          role="note"
        >
          <span className="font-semibold">Alergias:</span> {episode.allergies}
        </div>
      )}
    </header>
  );
}
