import type {
  PrescriptionDiagnosisRule,
  PrescriptionRuleMed,
} from "@/lib/clinical-rules/prescription-diagnosis";

export type SerializedPrescriptionRule = {
  id: string;
  versao: string;
  revisadoEm: string;
  fonte: string;
  ativo: boolean;
  validadoInstitucionalmente: boolean;
  pattern: string;
  label: string;
  pediatric?: boolean;
  meds: PrescriptionRuleMed[];
};

export function serializePrescriptionRule(
  rule: PrescriptionDiagnosisRule,
): SerializedPrescriptionRule {
  const pediatric = Boolean(rule.pediatric || rule.buildMeds);
  return {
    id: rule.id,
    versao: rule.versao,
    revisadoEm: rule.revisadoEm,
    fonte: rule.fonte,
    ativo: rule.ativo,
    validadoInstitucionalmente: rule.validadoInstitucionalmente,
    pattern: rule.pattern.source,
    label: rule.label,
    pediatric,
    meds: rule.meds,
  };
}

export function hydratePrescriptionRule(
  stored: SerializedPrescriptionRule,
  pediatricBuilders: Record<
    string,
    (weightKg: number) => PrescriptionRuleMed[]
  >,
): PrescriptionDiagnosisRule {
  let pattern: RegExp;
  try {
    pattern = new RegExp(stored.pattern, "i");
  } catch {
    pattern = /(?!)/;
  }
  const buildMeds = stored.pediatric
    ? pediatricBuilders[stored.id]
    : undefined;
  return {
    id: stored.id,
    versao: stored.versao,
    revisadoEm: stored.revisadoEm,
    fonte: stored.fonte,
    ativo: stored.ativo,
    validadoInstitucionalmente: stored.validadoInstitucionalmente,
    pattern,
    label: stored.label,
    pediatric: stored.pediatric,
    meds: stored.meds ?? [],
    buildMeds,
  };
}
