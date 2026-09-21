export type TipoTaqui = "tsvp" | "fa-flutter" | "tv-pulso";

export function instavel(instabilidade: boolean[], pas: number): boolean {
  return instabilidade.some(Boolean) || pas < 90;
}

export function classificarTipo(qrsEstreito: boolean, rrRegular: boolean): TipoTaqui {
  if (!qrsEstreito) return "tv-pulso";
  return rrRegular ? "tsvp" : "fa-flutter";
}

export function alertaWpw(tipo: TipoTaqui, rrIrregular: boolean): boolean {
  return tipo === "fa-flutter" || (tipo === "tv-pulso" && rrIrregular);
}

export type Cha2ds2vaKey =
  | "ic"
  | "has"
  | "dm"
  | "avc"
  | "vascular";

export function cha2ds2vaScore(ageYears: number, flags: Record<Cha2ds2vaKey, boolean>): number {
  let pts = 0;
  if (ageYears >= 75) pts += 2;
  else if (ageYears >= 65) pts += 1;
  if (flags.ic) pts += 1;
  if (flags.has) pts += 1;
  if (flags.dm) pts += 1;
  if (flags.avc) pts += 2;
  if (flags.vascular) pts += 1;
  return pts;
}

export function cha2ds2vaInterpretacao(score: number): string {
  if (score === 0) return "Geralmente não anticoagular.";
  if (score === 1) return "Individualizar (DOAC ou varfarina).";
  return "Anticoagular (DOAC ou varfarina).";
}

export type HasBledKey =
  | "has"
  | "renal"
  | "hepatica"
  | "avc"
  | "sangramento"
  | "inr"
  | "idade"
  | "aas"
  | "etilismo";

export function hasBledScore(flags: Record<HasBledKey, boolean>): number {
  return (Object.keys(flags) as HasBledKey[]).filter((k) => flags[k]).length;
}

export const ADENOSINA_DOSES_MG = [6, 12, 12] as const;
export const METOPROLOL_MAX_DOSES = 3;
export const METOPROLOL_MG = 5;
export const DILTIAZEM_MAX = 2;
export const AMIODARONA_MAX_MG = 300;
export const MAGNESIO_MAX = 2;
export const CARDIOVERSAO_J = [50, 100, 120, 150, 200] as const;

export function adenosinaDoseMg(index: number): number | null {
  return ADENOSINA_DOSES_MG[index] ?? null;
}

export function diltiazemMg(peso: number): number {
  return Math.round(0.25 * peso);
}

export function procainamidaTetoMg(peso: number): number {
  return Math.round(17 * peso);
}

export function heparinaBolusUi(peso: number): number {
  return Math.round(80 * peso);
}

export function enoxaparinaMg(peso: number): number {
  return Math.round(peso);
}
