import {
  RISK_LABELS,
  SEX_LABELS,
  STATUS_LABELS,
  type PatientEpisode,
  type PatientSex,
  type PatientStatus,
} from "@/lib/types/patient";
import { formatAge } from "@/lib/utils/age";
import { formatCpf } from "@/lib/utils/cpf";
import type { Patient, PatientMovement } from "@/lib/types/patient";
import type { ClinicalAssessmentRecord } from "@/lib/types/clinical-assessment";
import type { PatientDocumentBundle } from "./types";
import { buildStatusTimesSummary, formatDuration } from "@/lib/patient-status-time";

import { MEDSCRIPT_LOGO_PATH } from "@/lib/branding";

export { MEDSCRIPT_LOGO_PATH };

export function getLogoUrl() {
  if (typeof window === "undefined") return MEDSCRIPT_LOGO_PATH;
  return `${window.location.origin}${MEDSCRIPT_LOGO_PATH}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value.includes("T") ? value : `${value}T00:00:00`).toLocaleDateString(
    "pt-BR"
  );
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export function displayValue(value: string | null | undefined) {
  return value?.trim() ? value.trim() : "—";
}

export function patientAgeLabel(patient: Patient) {
  return patient.birth_date ? formatAge(patient.birth_date) ?? "—" : "—";
}

export function episodeStatusLabel(status: PatientStatus) {
  return STATUS_LABELS[status] ?? status;
}

export function episodeRiskLabel(risk: PatientEpisode["risk_level"]) {
  return risk ? RISK_LABELS[risk] : "—";
}

export function patientSexLabel(sex: PatientSex | null) {
  return sex ? SEX_LABELS[sex] : "—";
}

export function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export function hasAssessments(bundle: PatientDocumentBundle) {
  return bundle.episodes.some(
    (episode) =>
      episode.assessments.length > 0 ||
      Boolean(episode.initial_assessment?.trim())
  );
}

export function collectAssessmentEntries(
  episode: PatientEpisode & { assessments: ClinicalAssessmentRecord[] }
) {
  const entries: { label: string; date: string; content: string }[] = [];

  episode.assessments.forEach((assessment, index) => {
    entries.push({
      label: `Avaliação T0 #${episode.assessments.length - index}`,
      date: formatDateTime(assessment.created_at),
      content: assessment.summary,
    });
  });

  if (
    episode.initial_assessment?.trim() &&
    !episode.assessments.some(
      (assessment) => assessment.summary.trim() === episode.initial_assessment?.trim()
    )
  ) {
    entries.push({
      label: "T0 registrada na ficha",
      date: formatDateTime(episode.created_at),
      content: episode.initial_assessment.trim(),
    });
  }

  return entries;
}

export function formatMovementLine(movement: PatientMovement) {
  const status = episodeStatusLabel(movement.to_status);
  const report = movement.report_text?.trim();
  const duration =
    movement.duration_seconds && movement.duration_seconds > 0
      ? ` · ${formatDuration(movement.duration_seconds)} no status anterior`
      : "";
  return report
    ? `${status} — ${report}${duration}`
    : `${status}${duration}`;
}
