export type PatientStatus =
  | "triagem"
  | "em_observacao"
  | "internado"
  | "alta_recente"
  | "arquivado";

export type RiskLevel = "alto" | "medio" | "baixo";

export type PatientSex = "masculino" | "feminino" | "outro";

export type Patient = {
  id: string;
  admin_id: string;
  full_name: string;
  cpf: string;
  birth_date: string | null;
  sex: PatientSex | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type PatientEpisode = {
  id: string;
  patient_id: string;
  episode_number: number;
  status: PatientStatus;
  weight: string | null;
  bed: string | null;
  diagnosis: string | null;
  allergies: string | null;
  medications: string | null;
  initial_assessment: string | null;
  risk_level: RiskLevel | null;
  alta_days: number | null;
  alta_started_at: string | null;
  status_started_at: string | null;
  triagem_seconds: number;
  observacao_seconds: number;
  internado_seconds: number;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
};

export type PatientMovement = {
  id: string;
  episode_id: string;
  from_status: PatientStatus | null;
  to_status: PatientStatus;
  report_text: string;
  risk_level: RiskLevel | null;
  alta_days: number | null;
  duration_seconds: number | null;
  created_by: string | null;
  created_at: string;
};

import type { EpisodeCareSummary } from "@/lib/patient-care-summary";
import type { PatientCareItem } from "@/lib/types/patient-care";

export type KanbanEpisode = PatientEpisode & {
  patient: Patient;
  days_remaining: number | null;
  care_summary?: EpisodeCareSummary;
  care_items?: PatientCareItem[];
};

export const STATUS_LABELS: Record<PatientStatus, string> = {
  triagem: "Triagem",
  em_observacao: "Em Observação",
  internado: "Internado",
  alta_recente: "Alta Recente",
  arquivado: "Arquivado",
};

export const SEX_LABELS: Record<PatientSex, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  alto: "Alto Risco",
  medio: "Médio Risco",
  baixo: "Baixo Risco",
};

export const KANBAN_COLUMNS: PatientStatus[] = [
  "triagem",
  "em_observacao",
  "internado",
  "alta_recente",
];

export const INITIAL_KANBAN_OPTIONS: PatientStatus[] = [
  "triagem",
  "em_observacao",
  "internado",
];

export const ALLOWED_TRANSITIONS: Record<
  PatientStatus,
  PatientStatus[]
> = {
  triagem: ["em_observacao", "internado", "alta_recente"],
  em_observacao: ["internado"],
  internado: ["alta_recente"],
  alta_recente: ["triagem"],
  arquivado: [],
};

export type CreatePatientPayload = {
  full_name: string;
  cpf: string;
  birth_date: string;
  sex: PatientSex;
  weight?: string;
  bed?: string;
  diagnosis?: string;
  allergies?: string;
  medications?: string;
  initial_status: PatientStatus;
  initial_assessment?: string;
  risk_level?: RiskLevel;
  alta_days?: number;
};

export type UpdatePatientPayload = {
  full_name?: string;
  birth_date?: string;
  sex?: PatientSex;
};

export type UpdateEpisodePayload = {
  weight?: string;
  bed?: string;
  diagnosis?: string;
  allergies?: string;
  medications?: string;
  initial_assessment?: string;
};
