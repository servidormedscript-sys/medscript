import {
  matchPrescriptionDiagnosisRules,
  medsForRule,
} from "@/lib/clinical-rules/prescription-diagnosis";
import { parseWeightKg } from "@/lib/inpatient/parse-weight";

export type DiagnosisPlanBlock = {
  diagnosisLabel: string;
  lines: string[];
  source: string;
};

export function matchDiagnosisPlan(
  diagnosis: string | null | undefined,
  weightText?: string | null,
): DiagnosisPlanBlock | null {
  const weight = parseWeightKg(weightText ?? null);
  const rules = matchPrescriptionDiagnosisRules(diagnosis, weight);
  if (rules.length === 0) return null;
  const rule = rules[0]!;
  const meds = medsForRule(rule, weight);
  return {
    diagnosisLabel: rule.label,
    lines: meds.map(
      (m) =>
        `${m.name} ${m.dose} ${m.route} ${m.frequency}${
          m.durationDays ? `, ${m.durationDays} dias` : ""
        }`,
    ),
    source: rule.fonte,
  };
}
