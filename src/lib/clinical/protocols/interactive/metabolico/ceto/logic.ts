export type GravidadeCad = "grave" | "moderada" | "leve" | "indefinida";

export function gravidadeCad(ph: number, bic: number): GravidadeCad {
  if (ph < 7 || bic < 10) return "grave";
  if (ph < 7.24 || bic < 15) return "moderada";
  if (ph < 7.3 || bic < 18) return "leve";
  if (ph > 0 && bic > 0) return "indefinida";
  return "indefinida";
}

export function volumePrimeiraHoraMl(pesoKg: number): { min: number; max: number } {
  return { min: Math.round(pesoKg * 15), max: Math.round(pesoKg * 20) };
}

export function insulinaUiH(pesoKg: number): number {
  return round2(pesoKg * 0.1);
}

export type PotassioConduta =
  | "segurar_insulina"
  | "repor_20_30"
  | "sem_reposicao"
  | "informar";

export function condutaPotassio(k: number): PotassioConduta {
  if (!k || k <= 0) return "informar";
  if (k < 3.5) return "segurar_insulina";
  if (k < 5) return "repor_20_30";
  return "sem_reposicao";
}

export function precisaDextrose(glicemia: number): boolean {
  return glicemia > 0 && glicemia < 250;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
