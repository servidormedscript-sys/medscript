export const SINAIS_ORGANICOS = [
  "Convulsão",
  "Catatonia",
  "Disautonomia",
  "Alteração de movimento",
  "Alteração de consciência",
  "Déficit focal neurológico",
  "Febre",
  "Idade atípica para início",
  "Sem história psiquiátrica prévia",
  "Alucinação visual predominante",
  "Progressão atípica / subaguda",
] as const;

export function algumSinalOrganico(flags: boolean[]): boolean {
  return flags.some(Boolean);
}
