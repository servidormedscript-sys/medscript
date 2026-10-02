import { computeInternationDay } from "@/lib/inpatient/internation-day";
import { formatPhysicalExamBlock } from "@/lib/inpatient/physical-exam-defaults";
import { formatLabDayLines } from "@/lib/inpatient/lab-summary";
import { stripHtmlToPlain } from "@/lib/inpatient/handoff-text";
import {
  pickUltimoComDispositivo,
  pickUltimoVital,
  summarizeDevices,
  summarizeVitals,
} from "@/lib/inpatient/vital-devices";
import { buildActivePrescriptionLines } from "@/lib/inpatient/chart-prescription-summary";
import type {
  EpisodeEvolution,
  EpisodeImagingReport,
  EpisodeLabValue,
  EpisodeMedReconciliation,
  EpisodePhysicalExam,
  EpisodePrescription,
  EpisodeVitalRecord,
} from "@/lib/types/inpatient-chart";
import { pickLatestSignedEvolution } from "@/lib/inpatient/evolution-utils";
import type { Patient, PatientEpisode } from "@/lib/types/patient";
import { calculateAge } from "@/lib/utils/age";

export type DischargeDraft = {
  summary: string;
  orientations: string;
};

export function buildDischargeDraft(input: {
  patient: Patient;
  episode: PatientEpisode;
  vitalRecords: EpisodeVitalRecord[];
  physicalExams: EpisodePhysicalExam[];
  evolutions: EpisodeEvolution[];
  prescriptions: EpisodePrescription[];
  reconciliation: EpisodeMedReconciliation[];
  labValues: EpisodeLabValue[];
  imagingReports: EpisodeImagingReport[];
  conductText?: string | null;
}): DischargeDraft {
  const { patient, episode } = input;
  const age = patient.birth_date ? calculateAge(patient.birth_date) : null;
  const day = computeInternationDay(episode);
  const admission = new Date(episode.created_at).toLocaleString("pt-BR");

  const hd = episode.diagnosis?.trim() || "Não informado na admissão";

  const contextLines: string[] = [
    `Admissão: ${admission} (${day}º dia de internação).`,
    `Leito: ${episode.bed?.trim() || "—"}.`,
  ];
  if (age?.years != null) {
    contextLines.push(`Idade: ${age.years} anos. Sexo: ${patient.sex ?? "—"}.`);
  }
  if (episode.weight?.trim()) {
    contextLines.push(`Peso na ficha: ${episode.weight.trim()}.`);
  }
  if (episode.allergies?.trim()) {
    contextLines.push(`Alergias: ${episode.allergies.trim()}.`);
  }
  const acute = buildActivePrescriptionLines(input.prescriptions);
  if (acute.length > 0) {
    contextLines.push(`Medicações agudas ativas: ${acute.join("; ")}.`);
  }
  const ultimoDevice = pickUltimoComDispositivo(input.vitalRecords);
  if (ultimoDevice) {
    contextLines.push(`Dispositivos (último registro): ${summarizeDevices(ultimoDevice)}.`);
  }

  const lastEv = pickLatestSignedEvolution(input.evolutions);
  const evolutionBlock = lastEv
    ? stripHtmlToPlain(lastEv.content_html)
    : "Não há evolução registrada.";

  const ultimoVital = pickUltimoVital(input.vitalRecords);
  const vitalLine = ultimoVital
    ? `Sinais vitais (último registro): ${summarizeVitals(ultimoVital)}.`
    : "Sinais vitais: sem registro numérico recente.";

  const lastExam = input.physicalExams[0];
  let examBlock = "Não há exame físico registrado.";
  if (lastExam) {
    examBlock = formatPhysicalExamBlock(lastExam.systems);
  }

  const labLines = formatLabDayLines(input.labValues);
  const examsBlock =
    labLines.length > 0 ? labLines.join("\n") : "Nenhum exame laboratorial registrado.";

  const imaging =
    input.imagingReports.length > 0
      ? input.imagingReports
          .map(
            (r) =>
              `${new Date(r.reported_at).toLocaleDateString("pt-BR")} — ${r.title}: ${r.body_text.trim()}`,
          )
          .join("\n")
      : "Nenhum laudo de imagem registrado.";

  const impression = episode.diagnosis?.trim()
    ? episode.diagnosis.trim()
    : "Impressão diagnóstica não consolidada na ficha.";

  const summary = [
    "# HD",
    hd,
    "",
    "# CONTEXTO",
    contextLines.join("\n"),
    "",
    "# EVOLUÇÃO",
    evolutionBlock,
    "",
    "# EXAME FÍSICO NA ALTA",
    examBlock,
    vitalLine,
    "",
    "# EXAMES COMPLEMENTARES",
    examsBlock,
    "",
    "Laudos de imagem:",
    imaging,
    "",
    "# IMPRESSÃO DIAGNÓSTICA",
    impression,
  ].join("\n");

  const homeMeds = input.reconciliation
    .filter((r) => r.status === "mantida")
    .map((r) => `• ${r.medication_text} (mantida em casa)`);

  const orientLines: string[] = [];
  if (input.conductText?.trim()) {
    orientLines.push("Conduta na alta (registrada na aba Conduta):");
    orientLines.push(input.conductText.trim());
    orientLines.push("");
  }
  orientLines.push("Medicações para manter em casa:");
  orientLines.push(
    homeMeds.length > 0
      ? homeMeds.join("\n")
      : "Revisar reconciliação medicamentosa e prescrições.",
  );
  orientLines.push("");
  orientLines.push(
    "Orientações gerais e sinais de alarme: retorno se piora do quadro, febre persistente, dispneia, dor intensa ou qualquer sintoma novo preocupante. Seguir medicações prescritas.",
  );

  return {
    summary,
    orientations: orientLines.join("\n"),
  };
}

export function countPendingReconciliation(
  items: EpisodeMedReconciliation[],
): number {
  return items.filter((r) => r.status === "pendente").length;
}
