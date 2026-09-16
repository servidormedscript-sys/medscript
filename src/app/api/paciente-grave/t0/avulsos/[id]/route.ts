import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import {
  buildAssessmentSummary,
  generateSuggestions,
} from "@/lib/clinical/suggestion-rules";
import type { VitalSigns } from "@/lib/types/clinical-assessment";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;
  const { id } = await context.params;

  let body: {
    title?: string;
    vital_signs?: VitalSigns;
    findings?: Record<string, boolean>;
    complementary?: Record<string, boolean>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { title, vital_signs, findings, complementary } = body;

  if (!vital_signs || !findings || !complementary) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const reportTitle = title?.trim();
  if (!reportTitle) {
    return NextResponse.json(
      { error: "Informe um título para identificar a T0 avulsa." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("clinical_assessments")
    .select("id")
    .eq("id", id)
    .eq("is_standalone", true)
    .eq("admin_id", adminId!)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Laudo avulso não encontrado." }, { status: 404 });
  }

  const suggestions = generateSuggestions(vital_signs, findings, complementary);
  const summary = buildAssessmentSummary(
    vital_signs,
    findings,
    complementary,
    suggestions,
    reportTitle
  );

  const { data: assessment, error } = await supabase
    .from("clinical_assessments")
    .update({
      title: reportTitle,
      vital_signs,
      findings,
      complementary,
      suggestions,
      summary,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assessment, suggestions, summary });
}
