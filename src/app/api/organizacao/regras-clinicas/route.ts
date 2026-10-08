import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/api/require-admin";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { getOrganizationAdminId } from "@/lib/auth/get-organization-admin-id";
import { CLINICAL_RULES_VERSION } from "@/lib/clinical-rules/version";
import {
  getDefaultSerializedRules,
  parseStoredRules,
} from "@/lib/clinical-rules/prescription-rules-db";
import type { SerializedPrescriptionRule } from "@/lib/clinical-rules/prescription-rules-serialize";

async function ensureRuleSet(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >,
  adminId: string,
  userId: string,
) {
  const { data: existing } = await supabase
    .from("organization_clinical_rule_sets")
    .select("*")
    .eq("admin_id", adminId)
    .maybeSingle();

  if (existing) return existing;

  const defaults = getDefaultSerializedRules();
  const { data: inserted, error } = await supabase
    .from("organization_clinical_rule_sets")
    .insert({
      admin_id: adminId,
      rules_version: CLINICAL_RULES_VERSION,
      rules: defaults,
      updated_by: userId,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return inserted;
}

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId, user } = session;

  try {
    const row = await ensureRuleSet(supabase, adminId, user.id);
    const rules = parseStoredRules(row.rules);
    return NextResponse.json({
      rules_version: row.rules_version ?? CLINICAL_RULES_VERSION,
      rules,
      updated_at: row.updated_at,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao carregar regras." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const auth = await getAdminFromRequest();
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user, profile } = auth;
  const adminId = getOrganizationAdminId(profile);

  let body: {
    rules?: SerializedPrescriptionRule[];
    rules_version?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  if (!Array.isArray(body.rules) || body.rules.length === 0) {
    return NextResponse.json(
      { error: "Envie o array rules completo." },
      { status: 400 },
    );
  }

  const rules = body.rules as SerializedPrescriptionRule[];
  const version = body.rules_version?.trim() || CLINICAL_RULES_VERSION;

  const { data, error } = await supabase
    .from("organization_clinical_rule_sets")
    .upsert(
      {
        admin_id: adminId,
        rules_version: version,
        rules,
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
    updated_at: data.updated_at,
  });
}
