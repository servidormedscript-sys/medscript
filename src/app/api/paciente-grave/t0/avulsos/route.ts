import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;

  const { data, error } = await supabase
    .from("clinical_assessments")
    .select(
      `
      id,
      title,
      summary,
      vital_signs,
      findings,
      complementary,
      suggestions,
      created_at,
      created_by
    `
    )
    .eq("is_standalone", true)
    .eq("admin_id", adminId!)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data ?? [] });
}
