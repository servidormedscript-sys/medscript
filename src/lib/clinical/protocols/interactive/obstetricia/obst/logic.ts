export type ClassificacaoObst =
  | "sem_criterios"
  | "hipertensao_gestacional"
  | "pe_leve"
  | "pe_grave"
  | "eclampsia";

export function hipertensaoGestacional(pas: number, pad: number): boolean {
  return pas >= 140 || pad >= 90;
}

export type CriterioGravidadeKey =
  | "pas160"
  | "pad110"
  | "plaquetas"
  | "creatinina"
  | "tgo"
  | "eap"
  | "cefaleia"
  | "dor_epigastrica"
  | "convulsao";

export function algumCriterioGravidade(c: Record<CriterioGravidadeKey, boolean>): boolean {
  return Object.values(c).some(Boolean);
}

export function classificarObst(input: {
  eclampsia: boolean;
  gravidade: Record<CriterioGravidadeKey, boolean>;
  hipertensao: boolean;
  proteinuria: boolean;
}): ClassificacaoObst {
  if (input.eclampsia) return "eclampsia";
  if (algumCriterioGravidade(input.gravidade)) return "pe_grave";
  if (input.hipertensao && input.proteinuria) return "pe_leve";
  if (input.hipertensao) return "hipertensao_gestacional";
  return "sem_criterios";
}

export function precisaMg(classificacao: ClassificacaoObst): boolean {
  return classificacao === "eclampsia" || classificacao === "pe_grave";
}

export const HIDRALAZINA_MAX_DOSES = 3;
export const LABETALOL_MAX_DOSES = 5;
export const ACIDO_TRANEXAMICO_MAX_DOSES = 2;
