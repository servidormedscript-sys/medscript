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
import type { Patient, PatientEpisode } from "@/lib/types/patient";
import { calculateAge } from "@/lib/utils/age";

export type InternacaoDraft = {
  summary: string;
  orientations: string;
};

function sortAsc<T extends { recorded_at?: string; created_at?: string }>(
  items: T[],
  field: "recorded_at" | "created_at",
): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(String(a[field])).getTime() - new Date(String(b[field])).getTime(),
  );
}

function pickPrimeiroVital(records: EpisodeVitalRecord[]): EpisodeVitalRecord | null {
  const asc = sortAsc(records, "recorded_at");
  for (const r of asc) {
    const v = pickUltimoVital([r]);
    if (v) return r;
  }
  return pickUltimoVital(records);
}

function pickPrimeiraEvolucao(
  evolutions: EpisodeEvolution[],
): EpisodeEvolution | undefined {
  const signed = evolutions.filter((e) => e.signed_at);
  const asc = sortAsc(signed.length > 0 ? signed : evolutions, "created_at");
  return asc[0];
}

function pickPrimeiroExameFisico(
  exams: EpisodePhysicalExam[],
): EpisodePhysicalExam | undefined {
  const asc = [...exams].sort(
    (a, b) =>
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );
  return asc[0] ?? exams[0];
}

export function buildInternacaoDraft(input: {
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
  homeMedicationsText?: string | null;
}): InternacaoDraft {
  const { patient, episode } = input;
  const age = patient.birth_date ? calculateAge(patient.birth_date) : null;
  const day = computeInternationDay(episode);
  const admission = new Date(episode.created_at).toLocaleString("pt-BR");

  const hd = episode.diagnosis?.trim() || "Não informado na admissão";

  const contextLines: string[] = [
    `Admissão: ${admission} (${day}º dia de internação no momento do documento).`,
    `Leito: ${episode.bed?.trim() || "—"}.`,
  ];
  if (episode.care_specialty) {
    contextLines.push(`Especialidade: ${episode.care_specialty}.`);
  }
  if (age?.years != null) {
    contextLines.push(`Idade: ${age.years} anos. Sexo: ${patient.sex ?? "—"}.`);
  }
  if (episode.weight?.trim()) {
    contextLines.push(`Peso na ficha: ${episode.weight.trim()}.`);
  }
  if (episode.allergies?.trim()) {
    contextLines.push(`Alergias: ${episode.allergies.trim()}.`);
  }
  if (input.homeMedicationsText?.trim()) {
    contextLines.push(
      `Medicações de uso domiciliar (ficha): ${input.homeMedicationsText.trim()}.`,
    );
  }
  const pendingHome = input.reconciliation.filter((r) => r.status === "pendente");
  if (pendingHome.length > 0) {
    contextLines.push(
      `Reconciliação pendente: ${pendingHome.map((r) => r.medication_text).join("; ")}.`,
    );
  }
  const acute = buildActivePrescriptionLines(input.prescriptions);
  if (acute.length > 0) {
    contextLines.push(`Medicações agudas ativas: ${acute.join("; ")}.`);
  }
  const deviceRecord =
    pickUltimoComDispositivo(input.vitalRecords) ??
    pickPrimeiroVital(input.vitalRecords);
  if (deviceRecord) {
    contextLines.push(`Dispositivos: ${summarizeDevices(deviceRecord)}.`);
  }

  const firstEv = pickPrimeiraEvolucao(input.evolutions);
  const evolutionBlock = firstEv
    ? stripHtmlToPlain(firstEv.content_html)
    : "Não há evolução registrada.";

  const vitalRecord = pickPrimeiroVital(input.vitalRecords);
  const vitalLine = vitalRecord
    ? `Sinais vitais (registro de referência): ${summarizeVitals(vitalRecord)}.`
    : "Sinais vitais: sem registro numérico.";

  const examRecord = pickPrimeiroExameFisico(input.physicalExams);
  let examBlock = "Não há exame físico registrado.";
  if (examRecord) {
    examBlock = formatPhysicalExamBlock(examRecord.systems);
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
    "# EXAME FÍSICO NA INTERNAÇÃO",
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

  const orientLines: string[] = [];
  if (input.conductText?.trim()) {
    orientLines.push("Conduta / plano terapêutico (aba Conduta):");
    orientLines.push(input.conductText.trim());
    orientLines.push("");
  } else {
    orientLines.push(
      "Conduta: registrar plano na aba Conduta para incluir aqui automaticamente.",
    );
    orientLines.push("");
  }
  orientLines.push(
    "Justificativa de internação: permanência hospitalar para observação, investigação complementar e tratamento conforme evolução clínica documentada no prontuário.",
  );
  orientLines.push("");
  orientLines.push(
    "Orientações gerais: revisar diariamente sinais vitais, exames e evolução; atualizar este documento quando houver mudança relevante do quadro.",
  );

  return {
    summary,
    orientations: orientLines.join("\n"),
  };
}
