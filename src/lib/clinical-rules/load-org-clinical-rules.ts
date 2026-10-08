import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_LAB_CRITICAL_RULES,
  parseStoredLabRules,
  type SerializedLabCriticalRule,
} from "@/lib/clinical-rules/lab-critical-rules";
import { parseStoredRules } from "@/lib/clinical-rules/prescription-rules-db";
import type { SerializedPrescriptionRule } from "@/lib/clinical-rules/prescription-rules-serialize";

export type OrgClinicalRulesBundle = {
  prescriptionRules: SerializedPrescriptionRule[];
  labCriticalRules: SerializedLabCriticalRule[];
  rulesVersion: string | null;
};

export async function loadOrgClinicalRules(
  supabase: SupabaseClient,
  adminId: string,
): Promise<OrgClinicalRulesBundle> {
  const { data } = await supabase
    .from("organization_clinical_rule_sets")
    .select("rules, lab_critical_rules, rules_version")
    .eq("admin_id", adminId)
    .maybeSingle();

  if (!data) {
    return {
      prescriptionRules: parseStoredRules(null),
      labCriticalRules: DEFAULT_LAB_CRITICAL_RULES,
      rulesVersion: null,
    };
  }

  return {
    prescriptionRules: parseStoredRules(data.rules),
    labCriticalRules: parseStoredLabRules(data.lab_critical_rules),
    rulesVersion: data.rules_version != null ? String(data.rules_version) : null,
  };
}
