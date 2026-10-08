import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/api/require-admin";
import { getOrganizationAdminId } from "@/lib/auth/get-organization-admin-id";
import { CLINICAL_RULES_VERSION } from "@/lib/clinical-rules/version";
import {
  DEFAULT_LAB_CRITICAL_RULES,
  parseStoredLabRules,
} from "@/lib/clinical-rules/lab-critical-rules";
import { getDefaultSerializedRules, parseStoredRules } from "@/lib/clinical-rules/prescription-rules-db";

export async function POST() {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user, profile } = auth;
  const adminId = getOrganizationAdminId(profile);

  const rules = getDefaultSerializedRules();
  const lab_critical_rules = DEFAULT_LAB_CRITICAL_RULES;

  const { data, error } = await supabase
    .from("organization_clinical_rule_sets")
    .upsert(
      {
        admin_id: adminId,
        rules_version: CLINICAL_RULES_VERSION,
        rules,
        lab_critical_rules,
        updated_by: user!.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "admin_id" },
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    rules_version: data.rules_version,
    rules: parseStoredRules(data.rules),
    lab_critical_rules: parseStoredLabRules(data.lab_critical_rules),
    updated_at: data.updated_at,
  });
}
