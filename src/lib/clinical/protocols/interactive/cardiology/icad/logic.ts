export function adhereGrupo(ureia: number, pas: number, creat: number): 1 | 2 | 3 | 4 | 5 {
  const u = ureia >= 43;
  const p = pas >= 115;
  if (!u && p) return 1;
  if (!u && !p) return 2;
  if (u && p) return 3;
  if (u && !p && creat < 2.75) return 4;
  return 5;
}

export const ADHERE_MORTALIDADE: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "2,1%",
  2: "5,5%",
  3: "6,4%",
  4: "12,4%",
  5: "21,9%",
};

export function perfilIc(
  congesto: boolean,
  hipoperfundido: boolean
): "quente-seco" | "quente-congesto" | "frio-seco" | "frio-congesto" {
  if (congesto && hipoperfundido) return "frio-congesto";
  if (congesto) return "quente-congesto";
  if (hipoperfundido) return "frio-seco";
  return "quente-seco";
}

export function grauCongestao(pp: number, ps: number): string {
  if (pp >= 2 && ps >= 2) return "Grave";
  if ((pp >= 1 && ps >= 2) || (pp >= 2 && ps >= 1)) return "Predominante";
  if (pp >= 1 || ps >= 1) return "Leve";
  return "Sem congestão";
}

export function grauHipoperfusao(pts: number): string {
  if (pts >= 5) return "Grave";
  if (pts >= 3) return "Moderada";
  if (pts >= 1) return "Leve";
  return "Sem hipoperfusão";
}
