import {
  formatMedicationDateTime,
  formatMedicationTime,
  formatOverdueDuration,
  getIntervalLabel,
  getMedicationScheduleInfo,
  getTodayTakenDoses,
  isDoseTakenAtSlot,
} from "@/lib/medication-schedule";
import {
  EXAM_STATUS_LABELS,
  todayDateString,
  type PatientCareItem,
  type PatientMedicationDose,
} from "@/lib/types/patient-care";

export type EpisodeCareSummary = {
  pendingExamCount: number;
  pendingMedDoseCount: number;
  pendingExams: { title: string; scheduled_for: string | null }[];
  pendingMedDoses: {
    medication: string;
    schedule_time: string;
    due_at: string | null;
    is_overdue: boolean;
    overdue_label: string | null;
  }[];
};

export function isDoseTakenToday(
  doses: PatientMedicationDose[] | undefined,
  scheduleTime: string,
  today: string
) {
  return (doses ?? []).some(
    (dose) =>
      dose.dose_date === today &&
      dose.schedule_time === scheduleTime &&
      Boolean(dose.taken_at)
  );
}

export function isMedicationPending(item: PatientCareItem, now = new Date()) {
  return getMedicationScheduleInfo(item, now).isPending;
}

export function buildEpisodeCareSummary(
  items: PatientCareItem[],
  today = todayDateString(),
  now = new Date()
): EpisodeCareSummary {
  const exams = items.filter((item) => item.item_type === "exame");
  const pendingExams = exams
    .filter((item) => (item.exam_status ?? "pendente") === "pendente")
    .map((item) => ({
      title: item.title,
      scheduled_for: item.scheduled_for,
    }));

  const pendingMedDoses: EpisodeCareSummary["pendingMedDoses"] = [];

  items
    .filter((item) => item.item_type === "medicamento")
    .forEach((item) => {
      const schedule = getMedicationScheduleInfo(item, now);

      if (schedule.mode === "interval") {
        if (schedule.isPending && schedule.nextDueAt) {
          pendingMedDoses.push({
            medication: item.title,
            schedule_time: formatMedicationTime(schedule.nextDueAt),
            due_at: schedule.nextDueAt.toISOString(),
            is_overdue: schedule.isOverdue,
            overdue_label: schedule.overdueLabel,
          });
        }
        return;
      }

      (item.schedule_times ?? []).forEach((scheduleTime) => {
        if (!isDoseTakenAtSlot(item.medication_doses, scheduleTime)) {
          const dueAt = new Date(now);
          const [hours, minutes] = scheduleTime.split(":").map(Number);
          dueAt.setHours(hours, minutes, 0, 0);
          const isOverdue = now.getTime() >= dueAt.getTime();

          pendingMedDoses.push({
            medication: item.title,
            schedule_time: scheduleTime,
            due_at: dueAt.toISOString(),
            is_overdue: isOverdue,
            overdue_label: isOverdue ? formatOverdueDuration(dueAt, now) : null,
          });
        }
      });
    });

  return {
    pendingExamCount: pendingExams.length,
    pendingMedDoseCount: pendingMedDoses.length,
    pendingExams,
    pendingMedDoses,
  };
}

export function buildCareSummaryExportLines(
  items: PatientCareItem[],
  today = todayDateString(),
  now = new Date()
): string[] {
  if (items.length === 0) {
    return ["Nenhuma solicitação registrada no resumo do paciente."];
  }

  const lines: string[] = [];
  const exams = items.filter((item) => item.item_type === "exame");
  const medications = items.filter((item) => item.item_type === "medicamento");

  if (exams.length > 0) {
    lines.push("Exames:");
    exams.forEach((exam) => {
      const status = EXAM_STATUS_LABELS[exam.exam_status ?? "pendente"];
      const scheduled = exam.scheduled_for
        ? ` · agendado para ${new Date(exam.scheduled_for).toLocaleString("pt-BR")}`
        : "";
      const completed =
        exam.exam_status === "realizado" && exam.completed_at
          ? ` · realizado em ${new Date(exam.completed_at).toLocaleString("pt-BR")}`
          : "";
      lines.push(`• ${exam.title} — ${status}${scheduled}${completed}`);
      if (exam.notes?.trim()) {
        lines.push(`  Obs. solicitação: ${exam.notes.trim()}`);
      }
      if (exam.completion_notes?.trim()) {
        lines.push(`  Obs. resultado: ${exam.completion_notes.trim()}`);
      }
    });
  }

  if (medications.length > 0) {
    lines.push("Medicamentos:");
    medications.forEach((med) => {
      const schedule = getMedicationScheduleInfo(med, now);

      if (schedule.mode === "interval") {
        const intervalLabel = getIntervalLabel(med.dose_interval_hours) ?? "—";
        lines.push(`• ${med.title} — ${intervalLabel}`);

        if (schedule.lastTakenAt) {
          lines.push(
            `  Última tomada: ${formatMedicationDateTime(schedule.lastTakenAt)}`
          );
        } else {
          lines.push("  Nenhuma tomada registrada ainda.");
        }

        if (schedule.nextDueAt) {
          const status = schedule.isOverdue
            ? schedule.overdueLabel ?? "em atraso"
            : "aguardando";
          lines.push(
            `  Próxima dose: ${formatMedicationDateTime(schedule.nextDueAt)} (${status})`
          );
        }
      } else {
        const fixedSchedule = (med.schedule_times ?? []).join(", ") || "—";
        lines.push(`• ${med.title} — horários fixos: ${fixedSchedule}`);

        (med.schedule_times ?? []).forEach((scheduleTime) => {
          const taken = isDoseTakenAtSlot(med.medication_doses, scheduleTime);
          lines.push(
            `  - ${scheduleTime}: ${taken ? "tomado hoje" : "pendente hoje"}`
          );
        });
      }

      const todayDoses = getTodayTakenDoses(med.medication_doses, today);
      todayDoses.forEach((dose) => {
        const timeLabel = formatMedicationTime(new Date(dose.taken_at!));
        lines.push(
          dose.notes?.trim()
            ? `  Tomada ${timeLabel}: ${dose.notes.trim()}`
            : `  Tomada ${timeLabel}`
        );
      });

      if (med.notes?.trim()) {
        lines.push(`  Obs. medicamento: ${med.notes.trim()}`);
      }
    });
  }

  const summary = buildEpisodeCareSummary(items, today, now);
  if (summary.pendingExamCount > 0 || summary.pendingMedDoseCount > 0) {
    lines.push(
      `Pendências de hoje: ${summary.pendingExamCount} exame(s), ${summary.pendingMedDoseCount} dose(s) de medicamento.`
    );
  }

  return lines;
}

export function groupCareItemsByEpisode(
  items: (PatientCareItem & { episode_id: string })[]
) {
  return items.reduce<Record<string, PatientCareItem[]>>((acc, item) => {
    if (!acc[item.episode_id]) acc[item.episode_id] = [];
    acc[item.episode_id].push(item);
    return acc;
  }, {});
}
