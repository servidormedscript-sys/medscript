export type PatientCareItemType = "exame" | "medicamento";

export type PatientExamStatus = "pendente" | "realizado" | "cancelado";

export type PatientMedicationDose = {
  id: string;
  care_item_id: string;
  dose_date: string;
  schedule_time: string;
  taken_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type PatientCareItem = {
  id: string;
  episode_id: string;
  admin_id: string;
  item_type: PatientCareItemType;
  title: string;
  notes: string | null;
  exam_status: PatientExamStatus | null;
  scheduled_for: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  schedule_times: string[];
  dose_interval_hours: number | null;
  last_dose_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  medication_doses?: PatientMedicationDose[];
};

export const EXAM_STATUS_LABELS: Record<PatientExamStatus, string> = {
  pendente: "Pendente",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export const CARE_ITEM_TYPE_LABELS: Record<PatientCareItemType, string> = {
  exame: "Exame",
  medicamento: "Medicamento",
};

export function parseScheduleTimes(input: string): string[] {
  return input
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((time) => normalizeScheduleTime(time))
    .filter(Boolean) as string[];
}

export function normalizeScheduleTime(value: string): string | null {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function todayDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
