export type RassCompleto = 4 | 3 | 2 | 1 | 0 | -1 | -2 | -3 | -4 | -5 | null;

export const RASS_COMPLETO: { value: RassCompleto; label: string }[] = [
  { value: 4, label: "+4 Combativo" },
  { value: 3, label: "+3 Muito agitado" },
  { value: 2, label: "+2 Agitado" },
  { value: 1, label: "+1 Inquieto" },
  { value: 0, label: "0 Alerta e calmo" },
  { value: -1, label: "-1 Sonolento" },
  { value: -2, label: "-2 Sedação leve" },
  { value: -3, label: "-3 Sedação moderada" },
  { value: -4, label: "-4 Sedação profunda" },
  { value: -5, label: "-5 Não desperta" },
];

export function camAvaliavel(rass: RassCompleto): boolean {
  return rass !== null && rass > -4;
}

export function caracteristica4AlteracaoConsciencia(rass: RassCompleto): boolean {
  return rass !== null && rass !== 0;
}

export function camPositivo(c1: boolean, c2: boolean, c3: boolean, c4: boolean): boolean {
  return c1 && c2 && (c3 || c4);
}

export type SubtipoDelirium = "hiperativo" | "hipoativo" | "misto" | null;

export function subtipoDelirium(rass: RassCompleto, positivo: boolean): SubtipoDelirium {
  if (!positivo || rass === null) return null;
  if (rass > 0) return "hiperativo";
  if (rass < 0) return "hipoativo";
  return "misto";
}

export function alertaAgitacaoGrave(rass: RassCompleto): boolean {
  return rass !== null && rass >= 3;
}
