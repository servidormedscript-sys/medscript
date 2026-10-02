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
