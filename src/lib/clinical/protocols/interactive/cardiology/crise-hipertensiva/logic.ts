export type ClassificacaoHta = "emergencia" | "urgencia" | "assintomatica";

export function temLOA(sinais: boolean[]): boolean {
  return sinais.some(Boolean);
}

export function classificarHta(
  pas: number,
  pad: number,
  loa: boolean
): ClassificacaoHta {
  const elevada = pas >= 180 || pad >= 120;
  if (elevada && loa) return "emergencia";
  if (elevada && !loa) return "urgencia";
  return "assintomatica";
}

export type SubtipoEmergencia =
  | "dissecacao"
  | "encefalopatia"
  | "avc"
  | "sca"
  | "eap"
  | "pre-eclampsia"
  | "nao-especificada";

export function subtipoEmergencia(flags: {
  dorToracica: boolean;
  dorAbdominal: boolean;
  deficit: boolean;
  cefaleia: boolean;
  visual: boolean;
  dispneia: boolean;
  gestante: boolean;
}): SubtipoEmergencia {
  if (flags.dorToracica && flags.dorAbdominal) return "dissecacao";
  if (flags.deficit && flags.cefaleia && flags.visual) return "encefalopatia";
  if (flags.deficit) return "avc";
  if (flags.dorToracica) return "sca";
  if (flags.dispneia) return "eap";
  if (flags.gestante) return "pre-eclampsia";
  return "nao-especificada";
}

export const META_POR_SUBTIPO: Record<SubtipoEmergencia, string> = {
  dissecacao: "PAS < 120 mmHg em 20 min; FC < 60",
  encefalopatia: "Redução gradual de PAM (≈25% na 1ª hora)",
  avc: "<185/110 antes trombólise; <180/105 após",
  sca: "Redução até 25% PAM na 1ª hora",
  eap: "Redução até 25% PAM na 1ª hora",
  "pre-eclampsia": "Meta 150/100 mmHg",
  "nao-especificada": "Redução até 25% PAM na 1ª hora",
};
