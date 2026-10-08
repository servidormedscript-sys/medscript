import {
  activePrescriptions,
  formatAcuteMedicationLine,
  formatPrescriptionLine,
} from "@/lib/inpatient/prescription-format";
import type { EpisodePrescription } from "@/lib/types/inpatient-chart";

export function buildAcuteMedicationLines(
  prescriptions: EpisodePrescription[],
): string[] {
  return activePrescriptions(prescriptions)
    .map(formatAcuteMedicationLine)
    .filter((line): line is string => Boolean(line));
}

export function buildActivePrescriptionLines(
  prescriptions: EpisodePrescription[],
): string[] {
  return activePrescriptions(prescriptions).map(formatPrescriptionLine);
}

/** TRATAMENTOS JÁ REALIZADOS (CORE 5.7) — ativas e suspensas com datas. */
export function formatTreatmentsRealizedForCore(
  prescriptions: EpisodePrescription[],
): string {
  if (!prescriptions.length) {
    return "Nenhuma medicação registrada na prescrição.";
  }
  const sorted = [...prescriptions].sort(
    (a, b) =>
      new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  );
  return sorted
    .map((rx) => {
      const line = formatPrescriptionLine(rx);
      if (rx.suspended_at) {
        const end = new Date(rx.suspended_at).toLocaleString("pt-BR");
        return `• ${line} — suspensa em ${end}`;
      }
      const start = new Date(rx.started_at).toLocaleString("pt-BR");
      return `• ${line} — ativa desde ${start}`;
    })
    .join("\n");
}
