/** CIWA-Ar item scores: items 1-9 max 7, item 10 max 4 */
export const CIWA_MAX = [7, 7, 7, 7, 7, 7, 7, 7, 7, 4] as const;

export const CIWA_LABELS = [
  "1. Náusea/vômito",
  "2. Tremor",
  "3. Sudorese paroxística",
  "4. Ansiedade",
  "5. Agitação",
  "6. Tato (parestesias)",
  "7. Auditivo (ruídos)",
  "8. Visual (luzes)",
  "9. Cefaleia / sensação de cabeça",
  "10. Orientação / sensorium",
];

export function ciwaTotal(scores: number[]): number {
  return scores.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

export type GravidadeCiwa = "leve" | "moderado" | "grave";

export function gravidadeCiwa(total: number): GravidadeCiwa {
  if (total < 10) return "leve";
  if (total <= 15) return "moderado";
  return "grave";
}

export function tratarFarmacologicamente(total: number): boolean {
  return total >= 10;
}

export function alertaUti(total: number, wernicke: boolean): boolean {
  return total > 15 || wernicke;
}

export const DIAZEPAM_REF_MAX = 5;
export const LORAZEPAM_REF_MAX = 7;

export const TIAMINA_ESQUEMA = {
  semWernicke: "100–300 mg/dia",
  wernickeAtaque: "500 mg 3×/dia × 3 dias → 200–500 mg/dia ~5 dias → manutenção 100–500 mg VO 3×/dia",
};
