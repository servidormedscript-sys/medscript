export type ProtocolCategoryId =
  | "emergencia"
  | "cardiologia"
  | "neurologia"
  | "respiratorio"
  | "metabolico"
  | "gastroenterologia"
  | "obstetricia"
  | "saude-mental"
  | "manejo-uti"
  | "ferramentas";

export type PatientParams = {
  weightKg: number;
  ageYears: number;
  ageMonths: number;
};

export type AgeGroup =
  | "recem-nascido"
  | "lactente"
  | "crianca"
  | "adolescente"
  | "adulto";

export type DoseLine = {
  drug: string;
  calculatedDose: string;
  route: string;
  frequency?: string;
  notes?: string;
};

export type ProtocolStep = {
  title: string;
  items: string[];
};

export type ProtocolResult = {
  ageGroup: AgeGroup;
  ageGroupLabel: string;
  steps: ProtocolStep[];
  doses: DoseLine[];
  warnings: string[];
  references?: string[];
};

export type ClinicalProtocol = {
  id: string;
  categoryId: ProtocolCategoryId;
  name: string;
  summary: string;
  keywords: string[];
  /** Calculadora simples por peso/idade */
  hasDoseCalculator: boolean;
  /** Módulo assistencial completo (cronômetro, checklists, condutas) */
  hasInteractiveModule?: boolean;
};

export type ProtocolCategory = {
  id: ProtocolCategoryId;
  name: string;
  description: string;
  icon: string;
  accentClass: string;
  borderClass: string;
};
