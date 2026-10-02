import { formatPhysicalExamBlock } from "@/lib/inpatient/physical-exam-defaults";
import { matchDiagnosisPlan } from "@/lib/inpatient/evolution-diagnosis-plan";
import {
  getCriticalVitalAlerts,
  getVitalAlertsForRecord,
} from "@/lib/inpatient/vital-alerts";
import {
  pickUltimoComDispositivo,
  pickUltimoVital,
  summarizeDevices,
  summarizeVitals,
} from "@/lib/inpatient/vital-devices";
import { computeInternationDay } from "@/lib/inpatient/internation-day";
import { computeLabAlerts } from "@/lib/inpatient/lab-alerts";
import { formatLabDayLines } from "@/lib/inpatient/lab-summary";
import type {
  EpisodeImagingReport,
  EpisodeLabValue,
  EpisodePhysicalExam,
  EpisodeVitalRecord,
} from "@/lib/types/inpatient-chart";
import type { Patient, PatientEpisode } from "@/lib/types/patient";
import { calculateAge } from "@/lib/utils/age";

export type EvolutionDraftContext = {
  patient: Patient;
  episode: PatientEpisode;
  vitalRecords: EpisodeVitalRecord[];
  physicalExams: EpisodePhysicalExam[];
  /** Medicações agudas ativas (Fase 3) — linhas prontas para o item 6. */
  acuteMedicationLines?: string[];
  /** Prescrição ativa (Fase 3) — item 14. */
  activePrescriptionLines?: string[];
  /** Conduta salva (Fase 6) — item 15. */
  conductText?: string | null;
  /** Comorbidades estruturadas (Fase 2.9). */
  comorbidities?: string[];
  labValues?: EpisodeLabValue[];
  imagingReports?: EpisodeImagingReport[];
};

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function p(text: string, bold = false): string {
  const inner = esc(text);
  return bold ? `<p><strong>${inner}</strong></p>` : `<p>${inner}</p>`;
}

function pHtml(html: string): string {
  return `<p>${html}</p>`;
}

export function buildEvolutionDraftHtml(ctx: EvolutionDraftContext): string {
  const { patient, episode, vitalRecords, physicalExams } = ctx;
  const parts: string[] = [];

  const now = new Date();
  const dateLine = now.toLocaleDateString("pt-BR");
  parts.push(p(`EVOLUÇÃO MÉDICA — ${dateLine}`, true));

  const age = patient.birth_date ? calculateAge(patient.birth_date) : null;
  const ageYears = age?.years ?? null;
  const day = computeInternationDay(episode);
  const admission = new Date(episode.created_at).toLocaleDateString("pt-BR");
  const leito = episode.bed?.trim() || "—";

  const idLine =
    ageYears != null
      ? `${patient.full_name}, ${ageYears} anos, leito ${leito}, internado(a) desde ${admission} (${day}º dia de internação).`
      : `${patient.full_name}, leito ${leito}, internado(a) desde ${admission} (${day}º dia de internação).`;
  parts.push(p(idLine));

  if (episode.diagnosis?.trim()) {
    parts.push(p(`Diagnóstico: ${episode.diagnosis.trim()}`));
  }

  if (ctx.comorbidities?.length) {
    parts.push(p(`Comorbidades: ${ctx.comorbidities.join(", ")}`));
  }

  if (episode.allergies?.trim()) {
    parts.push(p(`Alergias: ${episode.allergies.trim()}`));
  }

  if (ctx.acuteMedicationLines && ctx.acuteMedicationLines.length > 0) {
    parts.push(p("Medicações agudas em curso:"));
    for (const line of ctx.acuteMedicationLines) {
      parts.push(p(`• ${line}`));
    }
  }

  const ultimoVital = pickUltimoVital(vitalRecords);
  const ultimoDevice = pickUltimoComDispositivo(vitalRecords);
  parts.push(p(`Sinais vitais: ${summarizeVitals(ultimoVital)}`));
  parts.push(p(`Dispositivos: ${summarizeDevices(ultimoDevice)}`));

  if (vitalRecords.length >= 2 && ultimoVital) {
    const critical = getCriticalVitalAlerts(ultimoVital);
    const rangeAlerts = getVitalAlertsForRecord(
      ultimoVital,
      patient.birth_date,
    );
    const combined = [...critical, ...rangeAlerts];
    if (combined.length > 0) {
      parts.push(p("Alertas no último registro de sinais vitais:"));
      for (const a of combined) {
        parts.push(p(`• ${a.message}`));
      }
    }
  }

  const lastPhysical = physicalExams[0];
  if (lastPhysical) {
    parts.push(p("Exame físico:", true));
    const block = formatPhysicalExamBlock(lastPhysical.systems);
    for (const line of block.split("\n")) {
      parts.push(p(line));
    }
  }

  parts.push(
    pHtml(
      "<strong>Evolução clínica:</strong> [descrever evolução do quadro nas últimas horas]",
    ),
  );

  if (ctx.labValues && ctx.labValues.length > 0) {
    parts.push(p("Exames:", true));
    for (const line of formatLabDayLines(ctx.labValues)) {
      parts.push(p(line));
    }
    const labAlerts = computeLabAlerts(ctx.labValues);
    for (const alert of labAlerts) {
      parts.push(p(`• ${alert.message}`));
    }
  }

  if (ctx.imagingReports && ctx.imagingReports.length > 0) {
    parts.push(p("Exames de imagem:", true));
    for (const img of ctx.imagingReports) {
      parts.push(
        p(
          `${new Date(img.reported_at).toLocaleDateString("pt-BR")} — ${img.body_text.slice(0, 500)}${img.body_text.length > 500 ? "…" : ""}`,
        ),
      );
    }
  }

  const plan = matchDiagnosisPlan(episode.diagnosis, episode.weight);
  if (plan) {
    parts.push(
      p(
        `Plano sugerido pelo diagnóstico — ${plan.diagnosisLabel} (revise e ajuste ao caso):`,
        true,
      ),
    );
    for (const line of plan.lines) {
      parts.push(p(`• ${line}`));
    }
    parts.push(p(`Fonte: ${plan.source}`));
  }

  if (ctx.activePrescriptionLines && ctx.activePrescriptionLines.length > 0) {
    parts.push(p("Prescrição em uso:", true));
    for (const line of ctx.activePrescriptionLines) {
      parts.push(p(`• ${line}`));
    }
  }

  if (ctx.conductText?.trim()) {
    parts.push(p(`Conduta atual: ${ctx.conductText.trim()}`));
  }

  return parts.join("\n");
}
