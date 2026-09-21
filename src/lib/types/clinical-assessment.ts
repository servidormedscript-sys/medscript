export type TecOption = "lt_3s" | "3_6s" | "gt_6s";

export type VitalSigns = {
  temperature: string;
  heart_rate: string;
  respiratory_rate: string;
  systolic_bp: string;
  spo2: string;
  weight: string;
  tec: TecOption | "";
  blood_glucose: string;
};

export type ClinicalAssessmentRecord = {
  id: string;
  episode_id: string | null;
  admin_id: string | null;
  title: string | null;
  is_standalone: boolean;
  assessment_type: "t0";
  vital_signs: VitalSigns;
  findings: Record<string, boolean>;
  complementary: Record<string, boolean>;
  suggestions: ClinicalSuggestion[];
  summary: string;
  created_by: string | null;
  created_at: string;
};

export type ClinicalSuggestion = {
  id: string;
  title: string;
  description: string;
  priority: "alta" | "media" | "baixa";
  score?: number;
  reasons?: string[];
  badge?: "prioridade_alta" | "considerar" | "possivel";
  protocolId?: string | null;
  categoryId?: string | null;
};

export type ActivePatientEpisode = {
  id: string;
  episode_number: number;
  status: string;
  patient: {
    id: string;
    full_name: string;
    cpf: string;
    birth_date: string | null;
    sex: string | null;
  };
};

export const TEC_LABELS: Record<TecOption, string> = {
  lt_3s: "< 3s (normal)",
  "3_6s": "3–6s",
  gt_6s: "> 6s",
};

export const EMPTY_VITAL_SIGNS: VitalSigns = {
  temperature: "",
  heart_rate: "",
  respiratory_rate: "",
  systolic_bp: "",
  spo2: "",
  weight: "",
  tec: "",
  blood_glucose: "",
};
