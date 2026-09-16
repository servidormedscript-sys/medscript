import type { AgeGroup, DoseLine, PatientParams } from "./types";

export function roundDose(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function formatMg(value: number): string {
  return `${roundDose(value)} mg`;
}

export function formatMcg(value: number): string {
  return `${roundDose(value)} mcg`;
}

export function formatMl(value: number): string {
  return `${roundDose(value, 1)} mL`;
}

export function formatG(value: number): string {
  return `${roundDose(value, 1)} g`;
}

export function getAgeGroup(params: PatientParams): AgeGroup {
  const totalMonths = params.ageYears * 12 + params.ageMonths;

  if (totalMonths < 1) return "recem-nascido";
  if (totalMonths < 12) return "lactente";
  if (params.ageYears < 12) return "crianca";
  if (params.ageYears < 18) return "adolescente";
  return "adulto";
}

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  "recem-nascido": "Recém-nascido (< 1 mês)",
  lactente: "Lactente (1–12 meses)",
  crianca: "Criança (1–11 anos)",
  adolescente: "Adolescente (12–17 anos)",
  adulto: "Adulto (≥ 18 anos)",
};

export function isPediatric(ageGroup: AgeGroup): boolean {
  return ageGroup !== "adulto" && ageGroup !== "adolescente";
}

export function weightBasedDose(
  weightKg: number,
  mgPerKg: number,
  maxMg?: number
): number {
  const dose = weightKg * mgPerKg;
  if (maxMg !== undefined) return Math.min(dose, maxMg);
  return dose;
}

export function doseLine(
  drug: string,
  calculatedDose: string,
  route: string,
  options?: { frequency?: string; notes?: string }
): DoseLine {
  return {
    drug,
    calculatedDose,
    route,
    frequency: options?.frequency,
    notes: options?.notes,
  };
}

export function validatePatientParams(
  weightKg: number,
  ageYears: number,
  ageMonths: number
): string | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 300) {
    return "Informe um peso válido entre 0,1 e 300 kg.";
  }
  if (!Number.isFinite(ageYears) || ageYears < 0 || ageYears > 120) {
    return "Informe uma idade válida em anos.";
  }
  if (!Number.isFinite(ageMonths) || ageMonths < 0 || ageMonths > 11) {
    return "Informe os meses complementares (0–11).";
  }
  return null;
}
