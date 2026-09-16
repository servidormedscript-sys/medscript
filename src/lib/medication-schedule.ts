import type { PatientCareItem, PatientMedicationDose } from "@/lib/types/patient-care";
import { normalizeScheduleTime } from "@/lib/types/patient-care";

export const DOSE_INTERVAL_OPTIONS = [
  { value: 1, label: "A cada 1 hora" },
  { value: 2, label: "A cada 2 horas" },
  { value: 4, label: "A cada 4 horas" },
  { value: 6, label: "A cada 6 horas" },
  { value: 8, label: "A cada 8 horas" },
  { value: 12, label: "A cada 12 horas" },
  { value: 24, label: "A cada 24 horas" },
] as const;

export const ALLOWED_DOSE_INTERVALS = DOSE_INTERVAL_OPTIONS.map((option) => option.value);

export type MedicationScheduleInfo = {
  mode: "interval" | "fixed";
  intervalHours: number | null;
  intervalLabel: string | null;
  lastTakenAt: Date | null;
  nextDueAt: Date | null;
  isPending: boolean;
  isOverdue: boolean;
  overdueLabel: string | null;
};

export function formatOverdueDuration(dueAt: Date, now = new Date()) {
  const diffMs = now.getTime() - dueAt.getTime();
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes < 60) {
    return `${totalMinutes} min de atraso`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours < 24) {
    return minutes > 0 ? `${hours}h ${minutes}min de atraso` : `${hours}h de atraso`;
  }

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h de atraso` : `${days}d de atraso`;
}

export function getMedicationStatusLabel(schedule: MedicationScheduleInfo) {
  if (!schedule.lastTakenAt && schedule.mode === "interval") {
    return "Aguardando primeira tomada";
  }

  if (schedule.isOverdue) {
    return schedule.overdueLabel ?? "Em atraso";
  }

  if (schedule.isPending) {
    return "Dose pendente";
  }

  if (schedule.nextDueAt) {
    return "Aguardando próximo horário";
  }

  return "Sem pendências";
}

export function formatMedicationTime(date: Date) {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMedicationDateTime(date: Date) {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function scheduleTimeFromDate(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getIntervalLabel(hours: number | null | undefined) {
  if (!hours) return null;
  return DOSE_INTERVAL_OPTIONS.find((option) => option.value === hours)?.label ?? `A cada ${hours} horas`;
}

export function getLastTakenAt(
  item: Pick<PatientCareItem, "last_dose_at">,
  doses?: PatientMedicationDose[]
) {
  if (item.last_dose_at) {
    return new Date(item.last_dose_at);
  }

  const takenDoses = (doses ?? [])
    .filter((dose) => dose.taken_at)
    .sort(
      (a, b) =>
        new Date(b.taken_at!).getTime() - new Date(a.taken_at!).getTime()
    );

  return takenDoses[0]?.taken_at ? new Date(takenDoses[0].taken_at) : null;
}

export function getNextDueAt(
  item: Pick<PatientCareItem, "dose_interval_hours" | "last_dose_at">,
  doses?: PatientMedicationDose[]
) {
  if (!item.dose_interval_hours) return null;

  const lastTaken = getLastTakenAt(item, doses);
  if (!lastTaken) return null;

  return new Date(lastTaken.getTime() + item.dose_interval_hours * 60 * 60 * 1000);
}

export function getMedicationScheduleInfo(
  item: PatientCareItem,
  now = new Date()
): MedicationScheduleInfo {
  if (item.dose_interval_hours) {
    const lastTakenAt = getLastTakenAt(item, item.medication_doses);
    const nextDueAt = getNextDueAt(item, item.medication_doses);
    const isOverdue = Boolean(nextDueAt && now.getTime() >= nextDueAt.getTime());
    const isPending = isOverdue;

    return {
      mode: "interval",
      intervalHours: item.dose_interval_hours,
      intervalLabel: getIntervalLabel(item.dose_interval_hours),
      lastTakenAt,
      nextDueAt,
      isPending,
      isOverdue,
      overdueLabel: nextDueAt && isOverdue ? formatOverdueDuration(nextDueAt, now) : null,
    };
  }

  const pendingSlots = (item.schedule_times ?? []).filter(
    (scheduleTime) =>
      !isDoseTakenAtSlot(item.medication_doses, scheduleTime)
  );

  const nextSlot = pendingSlots
    .map((scheduleTime) => ({ scheduleTime, dueAt: slotDueAt(scheduleTime, now) }))
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())[0];
  const isOverdue = nextSlot ? now.getTime() >= nextSlot.dueAt.getTime() : false;

  return {
    mode: "fixed",
    intervalHours: null,
    intervalLabel: null,
    lastTakenAt: getLastTakenAt(item, item.medication_doses),
    nextDueAt: nextSlot?.dueAt ?? null,
    isPending: pendingSlots.length > 0,
    isOverdue,
    overdueLabel:
      nextSlot && isOverdue ? formatOverdueDuration(nextSlot.dueAt, now) : null,
  };
}

export function isDoseTakenAtSlot(
  doses: PatientMedicationDose[] | undefined,
  scheduleTime: string
) {
  return (doses ?? []).some(
    (dose) => dose.schedule_time === scheduleTime && Boolean(dose.taken_at)
  );
}

function slotDueAt(scheduleTime: string, reference: Date) {
  const normalized = normalizeScheduleTime(scheduleTime);
  if (!normalized) return reference;

  const [hours, minutes] = normalized.split(":").map(Number);
  const dueAt = new Date(reference);
  dueAt.setHours(hours, minutes, 0, 0);
  return dueAt;
}

export function getTodayTakenDoses(doses: PatientMedicationDose[] | undefined, today: string) {
  return (doses ?? [])
    .filter((dose) => dose.dose_date === today && dose.taken_at)
    .sort(
      (a, b) =>
        new Date(a.taken_at!).getTime() - new Date(b.taken_at!).getTime()
    );
}
