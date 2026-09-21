export function qsofaScore(fr: number, pas: number, glasgow: number): number {
  let s = 0;
  if (fr >= 22) s++;
  if (pas <= 100) s++;
  if (glasgow < 15) s++;
  return s;
}

export function heartTotal(domains: number[]): number {
  return domains.reduce((a, b) => a + b, 0);
}

export function heartRisco(total: number): string {
  if (total <= 3) return "Baixo (~0,9–1,7% MACE 6 sem)";
  if (total <= 6) return "Moderado";
  return "Alto — considerar estratégia invasiva precoce";
}

export function heartCompleto(domains: number[]): boolean {
  return domains.every((d) => d >= 0 && d <= 2);
}

export function wellsTeP(flags: {
  tvp: boolean;
  tepProvavel: boolean;
  fc100: boolean;
  imobilizacao: boolean;
  tepPrevio: boolean;
  hemoptise: boolean;
  cancer: boolean;
}): number {
  let s = 0;
  if (flags.tvp) s += 3;
  if (flags.tepProvavel) s += 3;
  if (flags.fc100) s += 1.5;
  if (flags.imobilizacao) s += 1.5;
  if (flags.tepPrevio) s += 1.5;
  if (flags.hemoptise) s += 1;
  if (flags.cancer) s += 1;
  return s;
}

export function paduaScore(flags: Record<string, boolean>): number {
  const pts: Record<string, number> = {
    cancer: 3,
    tevPrevio: 3,
    mobilidade: 3,
    trombofilia: 3,
    trauma: 2,
    idade70: 1,
    icResp: 1,
    iamAvc: 1,
    infeccao: 1,
    obesidade: 1,
    hormonal: 1,
  };
  return Object.entries(flags).reduce((sum, [k, v]) => sum + (v ? pts[k] ?? 0 : 0), 0);
}
