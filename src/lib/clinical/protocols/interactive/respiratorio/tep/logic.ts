export function yearsDDimerCutoff(yearsCriteria: number): number {
  return yearsCriteria > 0 ? 500 : 1000;
}

export function yearsExcluiTeP(dDimer: number, yearsCriteria: number): boolean {
  if (dDimer <= 0) return false;
  return dDimer < yearsDDimerCutoff(yearsCriteria);
}

export function dDimerIdadeCutoff(idade: number): number {
  return idade > 50 ? idade * 10 : 500;
}

export function spesiScore(flags: {
  idade80: boolean;
  cancer: boolean;
  cardiopulmonar: boolean;
  fc110: boolean;
  pas100: boolean;
  spo290: boolean;
}): number {
  return Object.values(flags).filter(Boolean).length;
}

export type CategoriaTep = "A" | "B" | "C1" | "C2" | "C3" | "D" | "E1" | "E2";

export function categoriaTep(input: {
  incidental: boolean;
  choqueRefratario: boolean;
  pas: number;
  preFalencia: boolean;
  spesi: number;
  hestia: number;
  disfuncaoVd: boolean;
  biomarcador: boolean;
}): CategoriaTep {
  if (input.incidental) return "A";
  if (input.choqueRefratario) return "E2";
  if (input.pas > 0 && input.pas < 90) return "E1";
  if (input.preFalencia) return "D";
  if (input.spesi >= 1 || input.hestia >= 1) {
    if (input.disfuncaoVd && input.biomarcador) return "C3";
    if (input.disfuncaoVd || input.biomarcador) return "C2";
    return "C1";
  }
  return "B";
}

export function precisaPert(cat: CategoriaTep): boolean {
  return cat === "D" || cat === "E1" || cat === "E2";
}
