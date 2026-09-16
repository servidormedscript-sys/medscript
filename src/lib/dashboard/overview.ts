import {
  formatMedicationDateTime,
  formatOverdueDuration,
  getMedicationScheduleInfo,
} from "@/lib/medication-schedule";
import type { KanbanEpisode, RiskLevel } from "@/lib/types/patient";
import { KANBAN_COLUMNS, RISK_LABELS, STATUS_LABELS } from "@/lib/types/patient";
import type { PatientCareItem } from "@/lib/types/patient-care";
import type { PatientStatus } from "@/lib/types/patient";

export type KanbanColumnStatus =
  | "triagem"
  | "em_observacao"
  | "internado"
  | "alta_recente";

export type DashboardMedicationAlert = {
  alert_id: string;
  care_item_id: string;
  episode_id: string;
  patient_name: string;
  bed: string | null;
  status: PatientStatus;
  medication: string;
  due_at: string;
  is_overdue: boolean;
  overdue_label: string | null;
  minutes_until_due: number;
};

export const MEDICATION_URGENT_WINDOW_MINUTES = 5;

export type DashboardRiskPatient = {
  episode_id: string;
  patient_name: string;
  bed: string | null;
  status: PatientStatus;
  risk_level: RiskLevel;
  diagnosis: string | null;
};

export type DashboardOverview = {
  kanban_counts: Record<KanbanColumnStatus, number>;
  total_active: number;
  medication_alerts: DashboardMedicationAlert[];
  risk_patients: DashboardRiskPatient[];
  triagem_patients: {
    episode_id: string;
    patient_name: string;
    bed: string | null;
  }[];
};

const UPCOMING_WINDOW_MINUTES = 120;

export function buildMedicationAlerts(
  episodes: KanbanEpisode[],
  itemsByEpisode: Record<string, PatientCareItem[]>,
  now = new Date(),
  upcomingWindowMinutes = UPCOMING_WINDOW_MINUTES
): DashboardMedicationAlert[] {
  const windowMs = upcomingWindowMinutes * 60 * 1000;
  const alerts: DashboardMedicationAlert[] = [];

  episodes.forEach((episode) => {
    const items = itemsByEpisode[episode.id] ?? [];

    items
      .filter((item) => item.item_type === "medicamento")
      .forEach((item) => {
        const schedule = getMedicationScheduleInfo(
          { ...item, medication_doses: item.medication_doses },
          now
        );

        if (!schedule.nextDueAt) return;

        const diffMs = schedule.nextDueAt.getTime() - now.getTime();
        const isOverdue = diffMs <= 0;
        const isUpcoming = diffMs > 0 && diffMs <= windowMs;

        if (!isOverdue && !isUpcoming) return;

        alerts.push({
          alert_id: `${item.id}:${schedule.nextDueAt.toISOString()}`,
          care_item_id: item.id,
          episode_id: episode.id,
          patient_name: episode.patient.full_name,
          bed: episode.bed,
          status: episode.status,
          medication: item.title,
          due_at: schedule.nextDueAt.toISOString(),
          is_overdue: isOverdue,
          overdue_label: isOverdue
            ? formatOverdueDuration(schedule.nextDueAt, now)
            : null,
          minutes_until_due: Math.round(diffMs / 60000),
        });
      });
  });

  return alerts.sort(
    (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
  );
}

export function buildRiskPatients(episodes: KanbanEpisode[]): DashboardRiskPatient[] {
  return episodes
    .filter(
      (episode) =>
        episode.risk_level === "alto" || episode.risk_level === "medio"
    )
    .map((episode) => ({
      episode_id: episode.id,
      patient_name: episode.patient.full_name,
      bed: episode.bed,
      status: episode.status,
      risk_level: episode.risk_level!,
      diagnosis: episode.diagnosis,
    }))
    .sort((a, b) => {
      if (a.risk_level === b.risk_level) {
        return a.patient_name.localeCompare(b.patient_name, "pt-BR");
      }
      return a.risk_level === "alto" ? -1 : 1;
    });
}

export function buildDashboardOverview(
  episodes: KanbanEpisode[],
  itemsByEpisode: Record<string, PatientCareItem[]>,
  now = new Date()
): DashboardOverview {
  const kanban_counts = KANBAN_COLUMNS.reduce(
    (acc, status) => {
      acc[status as KanbanColumnStatus] = episodes.filter(
        (episode) => episode.status === status
      ).length;
      return acc;
    },
    {} as Record<KanbanColumnStatus, number>
  );

  return {
    kanban_counts,
    total_active: episodes.length,
    medication_alerts: buildMedicationAlerts(episodes, itemsByEpisode, now),
    risk_patients: buildRiskPatients(episodes),
    triagem_patients: episodes
      .filter((episode) => episode.status === "triagem")
      .map((episode) => ({
        episode_id: episode.id,
        patient_name: episode.patient.full_name,
        bed: episode.bed,
      })),
  };
}

export function formatMinutesUntilDue(minutes: number) {
  if (minutes <= 0) return "agora";
  if (minutes < 60) return `em ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `em ${hours}h ${rem}min` : `em ${hours}h`;
}

export function formatMedicationAlertTime(alert: DashboardMedicationAlert) {
  if (alert.is_overdue) {
    return alert.overdue_label ?? "em atraso";
  }
  return formatMinutesUntilDue(alert.minutes_until_due);
}

export { STATUS_LABELS, RISK_LABELS, formatMedicationDateTime };
