import type { EpisodePrescription } from "@/lib/types/inpatient-chart";

export function treatmentDay(rx: EpisodePrescription, at = new Date()): number | null {
  if (rx.use_continuous || rx.suspended_at) return null;
  const start = new Date(rx.started_at);
  const diff = at.getTime() - start.getTime();
  if (diff < 0) return 1;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function formatPrescriptionLine(rx: EpisodePrescription): string {
  const parts = [
    rx.name,
    rx.dose,
    rx.route,
    rx.frequency,
  ].filter(Boolean);
  let line = parts.join(" ");
  if (rx.indication) line += ` — ${rx.indication}`;
  const day = treatmentDay(rx);
  if (day != null) {
    line += ` (D${day})`;
  } else if (rx.use_continuous) {
    line += " (uso contínuo)";
  }
  return line;
}

export function formatAcuteMedicationLine(rx: EpisodePrescription): string | null {
  if (rx.suspended_at) return null;
  const day = treatmentDay(rx);
  if (rx.use_continuous || day == null) return null;
  const base = [rx.name, rx.dose, rx.route, rx.frequency]
    .filter(Boolean)
    .join(" ");
  const reason = rx.indication ? ` por ${rx.indication}` : "";
  return `Em D${day} de ${base}${reason}.`;
}

export function activePrescriptions(
  list: EpisodePrescription[],
): EpisodePrescription[] {
  return list.filter((r) => !r.suspended_at);
}

export function suspendedPrescriptions(
  list: EpisodePrescription[],
): EpisodePrescription[] {
  return list.filter((r) => r.suspended_at);
}
