const COMPROMISSO_KEYS = [
  "hipotensao",
  "consciencia",
  "choque",
  "dor_toracica",
  "ic",
] as const;

export type CompromissoKey = (typeof COMPROMISSO_KEYS)[number];

export function comprometido(flags: Record<CompromissoKey, boolean>): boolean {
  return COMPROMISSO_KEYS.some((k) => flags[k]);
}

export const COMPROMISSO_LABELS: Record<CompromissoKey, string> = {
  hipotensao: "Hipotensão",
  consciencia: "Alteração de consciência",
  choque: "Sinais de choque",
  dor_toracica: "Dor torácica isquêmica",
  ic: "Insuficiência cardíaca aguda",
};

export const ATROPINA_MAX_DOSES = 3;
