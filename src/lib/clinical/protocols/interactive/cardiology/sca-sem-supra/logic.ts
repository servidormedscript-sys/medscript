export function heartDomainAge(idade: number): 0 | 1 | 2 {
  if (idade >= 65) return 2;
  if (idade >= 45) return 1;
  return 0;
}

export function heartDomainTroponina(ratioLsn: number): 0 | 1 | 2 {
  if (ratioLsn > 3) return 2;
  if (ratioLsn > 1) return 1;
  return 0;
}

export function heartTotal(domains: number[]): number {
  return domains.reduce((a, b) => a + b, 0);
}

export function heartRisco(total: number): "baixo" | "moderado" | "alto" {
  if (total <= 3) return "baixo";
  if (total <= 6) return "moderado";
  return "alto";
}

export function heartMaceLabel(risco: ReturnType<typeof heartRisco>): string {
  if (risco === "baixo") return "MACE ~1,7% em 6 semanas";
  if (risco === "moderado") return "MACE ~16,6%";
  return "MACE ~50,1%";
}

export function diagnosticoSca(troponinaPositiva: boolean): "IAMSSST" | "angina-instavel" {
  return troponinaPositiva ? "IAMSSST" : "angina-instavel";
}

export function estrategiaInvasiva(
  instavel: boolean,
  risco: ReturnType<typeof heartRisco>,
  troponinaPositiva: boolean
): string {
  if (instavel) return "Invasiva imediata (<2 h)";
  if (risco === "alto" || troponinaPositiva) return "Invasiva precoce (<24 h)";
  if (risco === "moderado") return "Invasiva tardia (24–72 h) ou conservadora";
  return "Conservadora (troponina negativa, baixo risco)";
}
