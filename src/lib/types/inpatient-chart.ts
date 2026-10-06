export type O2Type = "ar_ambiente" | "cateter" | "maf" | "vni" | "vm";

export type CareLocation = "enfermaria" | "emergencia" | "uti";

export type EpisodeVitalRecord = {
  id: string;
  episode_id: string;
  recorded_at: string;
  pas: number | null;
  pad: number | null;
  fc: number | null;
  fr: number | null;
  spo2: number | null;
  temperature: number | null;
  glasgow: number | null;
  diurese_ml: number | null;
  observation: string | null;
  o2_type: O2Type;
  o2_flow_lmin: number | null;
  central_venous_access: boolean;
  iot: boolean;
  monitoring: boolean;
  care_location: CareLocation;
  created_by: string | null;
  created_at: string;
  author_name?: string | null;
};

export type PhysicalExamSystemKey =
  | "estado_geral"
  | "cardiovascular"
  | "respiratorio"
  | "abdome"
  | "extremidades"
  | "neurologico"
  | "pele_mucosas";

export type PhysicalExamSystemState = {
  altered: boolean;
  note: string;
};

export type PhysicalExamSystems = Record<
  PhysicalExamSystemKey,
  PhysicalExamSystemState
>;

export type EpisodePhysicalExam = {
  id: string;
  episode_id: string;
  recorded_at: string;
  without_changes: boolean;
  systems: PhysicalExamSystems;
  created_by: string | null;
  created_at: string;
  author_name?: string | null;
};

export type EpisodeEvolution = {
  id: string;
  episode_id: string;
  content_html: string;
  created_by: string | null;
  created_at: string;
  signed_at: string | null;
  signed_by: string | null;
  addendum_of_id: string | null;
  addendum_reason: string | null;
  author_name?: string | null;
};

export type MedReconciliationStatus = "pendente" | "mantida" | "suspensa";

export type EpisodePrescription = {
  id: string;
  episode_id: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  indication: string;
  duration_days: number | null;
  use_continuous: boolean;
  started_at: string;
  suspended_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type PrescriptionInput = {
  name: string;
  dose?: string;
  route?: string;
  frequency?: string;
  indication?: string;
  duration_days?: number | null;
  use_continuous?: boolean;
  started_at?: string;
};

export type EpisodeMedReconciliation = {
  id: string;
  episode_id: string;
  medication_text: string;
  status: MedReconciliationStatus;
  decided_at: string | null;
  decided_by: string | null;
  linked_prescription_id: string | null;
  created_at: string;
};

export type CodeStatus = "reanimacao_plena" | "onr" | "conforto";

export type CoreStatus = "nenhum" | "aguardando" | "autorizado" | "negado";

export type TransferClass =
  | "sem"
  | "prioritaria"
  | "urgente"
  | "emergencial";

export type EpisodeConduct = {
  episode_id: string;
  code_status: CodeStatus;
  code_justification: string | null;
  code_updated_at: string | null;
  code_updated_by: string | null;
  conduct_text: string;
  contingency_plan: string;
  resource_needed: string;
  unit_limitations: Record<string, boolean>;
  unit_limitation_other: string;
  core_status: CoreStatus;
  vaga_judicializada: boolean;
  judicial_started_at: string | null;
  judicial_process: string;
  transfer_class: TransferClass;
  transfer_class_justification: string;
  transfer_class_confirmed: boolean;
  no_specific_treatment: boolean;
  no_treatment_response_waiver: boolean;
  updated_at: string;
};

export type EpisodeProblem = {
  id: string;
  episode_id: string;
  text: string;
  active: boolean;
  started_at: string;
  resolved_at: string | null;
  created_at: string;
};

export type TreatmentResponseStatus =
  | "melhora"
  | "melhora_parcial"
  | "sem_mudanca"
  | "sem_resposta"
  | "piora";

export type EpisodeTreatmentResponse = {
  id: string;
  episode_id: string;
  problem_id: string;
  response_status: TreatmentResponseStatus;
  notes: string;
  linked_prescription_ids: string[];
  created_by: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type EpisodeComorbidities = {
  episode_id: string;
  flags: Record<string, boolean>;
  other_text: string;
  problems_seeded: boolean;
  updated_at: string;
};

export type EpisodeDischarge = {
  episode_id: string;
  summary_text: string;
  orientations_text: string;
  transfer_note: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
  alta_days: number | null;
  created_at: string;
  updated_at: string;
};

export type EpisodeInternacao = {
  episode_id: string;
  summary_text: string;
  orientations_text: string;
  finalized_at: string | null;
  finalized_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EpisodeHandoffTask = {
  id: string;
  episode_id: string;
  text: string;
  completed: boolean;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  author_name?: string | null;
};

export type EpisodeGeneralOrders = {
  episode_id: string;
  order_flags: Record<string, boolean>;
  diet: string;
  vitals_frequency: string;
  padua_score: Record<string, boolean>;
  caprini_score: Record<string, boolean>;
  updated_at: string;
};

export type EpisodeLabValue = {
  id: string;
  episode_id: string;
  analyte_key: string;
  value: number;
  collected_at: string;
  created_by: string | null;
  created_at: string;
};

export type EpisodeLabPending = {
  id: string;
  episode_id: string;
  label: string;
  analyte_key: string | null;
  requested_at: string;
  expected_note: string | null;
  urgent: boolean;
  fulfilled_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type EpisodeImagingReport = {
  id: string;
  episode_id: string;
  title: string;
  body_text: string;
  reported_at: string;
  created_by: string | null;
  created_at: string;
};

export type VitalRecordInput = {
  recorded_at?: string;
  pas?: number | null;
  pad?: number | null;
  fc?: number | null;
  fr?: number | null;
  spo2?: number | null;
  temperature?: number | null;
  glasgow?: number | null;
  diurese_ml?: number | null;
  observation?: string | null;
  o2_type?: O2Type;
  o2_flow_lmin?: number | null;
  central_venous_access?: boolean;
  iot?: boolean;
  monitoring?: boolean;
  care_location?: CareLocation;
};
