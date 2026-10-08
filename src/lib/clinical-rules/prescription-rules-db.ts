import { CLINICAL_RULES_VERSION } from "@/lib/clinical-rules/version";
import {
  DEFAULT_PRESCRIPTION_RULES,
  getPediatricRuleBuilders,
  matchRulesFromList,
} from "@/lib/clinical-rules/prescription-diagnosis";
import {
  hydratePrescriptionRule,
  serializePrescriptionRule,
  type SerializedPrescriptionRule,
} from "@/lib/clinical-rules/prescription-rules-serialize";
import type { PrescriptionDiagnosisRule } from "@/lib/clinical-rules/prescription-diagnosis";

export function getDefaultSerializedRules(): SerializedPrescriptionRule[] {
  return DEFAULT_PRESCRIPTION_RULES.map(serializePrescriptionRule);
}

export function hydrateRuleSet(
  stored: SerializedPrescriptionRule[],
): PrescriptionDiagnosisRule[] {
  const builders = getPediatricRuleBuilders();
  return stored.map((s) => hydratePrescriptionRule(s, builders));
}

export function parseStoredRules(json: unknown): SerializedPrescriptionRule[] {
  if (!Array.isArray(json) || json.length === 0) {
    return getDefaultSerializedRules();
  }
  return json as SerializedPrescriptionRule[];
}

export function rulesFromStored(json: unknown): PrescriptionDiagnosisRule[] {
  return hydrateRuleSet(parseStoredRules(json));
}

export function matchStoredPrescriptionRules(
  diagnosis: string | null | undefined,
  weightKg: number | null,
  stored: SerializedPrescriptionRule[],
): PrescriptionDiagnosisRule[] {
  return matchRulesFromList(
    diagnosis,
    weightKg,
    hydrateRuleSet(stored),
  );
}

export function clinicalRulesVersionLabel(storedVersion?: string | null): string {
  return storedVersion?.trim() || CLINICAL_RULES_VERSION;
}
