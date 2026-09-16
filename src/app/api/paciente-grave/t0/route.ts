import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import {
  buildAssessmentSummary,
  generateSuggestions,
} from "@/lib/clinical/suggestion-rules";
import type { VitalSigns } from "@/lib/types/clinical-assessment";

export async function GET(request: Request) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase } = session;
  const episodeId = new URL(request.url).searchParams.get("episode_id");

  if (!episodeId) {
    return NextResponse.json({ error: "episode_id é obrigatório." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("clinical_assessments")
    .select("*")
    .eq("episode_id", episodeId)
    .eq("is_standalone", false)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assessments: data ?? [] });
}

export async function POST(request: Request) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId, user } = session;

  let body: {
    episode_id?: string;
    standalone?: boolean;
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

  const { episode_id, standalone, title, vital_signs, findings, complementary } =
    body;

  if (!vital_signs || !findings || !complementary) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const suggestions = generateSuggestions(vital_signs, findings, complementary);

  if (standalone) {
    const reportTitle = title?.trim();
    if (!reportTitle) {
      return NextResponse.json(
        { error: "Informe um título para identificar a T0 avulsa." },
        { status: 400 }
      );
    }

    const summary = buildAssessmentSummary(
      vital_signs,
      findings,
      complementary,
      suggestions,
      reportTitle
    );

    const { data: assessment, error: insertError } = await supabase
      .from("clinical_assessments")
      .insert({
        episode_id: null,
        admin_id: adminId,
        title: reportTitle,
        is_standalone: true,
        vital_signs,
        findings,
        complementary,
        suggestions,
        summary,
        created_by: user!.id,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(
      { assessment, suggestions, summary, standalone: true },
      { status: 201 }
    );
  }

  if (!episode_id) {
    return NextResponse.json(
      { error: "Selecione um paciente ou marque T0 avulsa." },
      { status: 400 }
    );
  }

  const { data: episode } = await supabase
    .from("patient_episodes")
    .select("*, patient:patients (*)")
    .eq("id", episode_id)
    .single();

  if (!episode || episode.patient?.admin_id !== adminId) {
    return NextResponse.json({ error: "Episódio não encontrado." }, { status: 404 });
  }

  const patientName = episode.patient?.full_name ?? "Paciente";
  const summary = buildAssessmentSummary(
    vital_signs,
    findings,
    complementary,
    suggestions,
    patientName
  );

  const { data: assessment, error: insertError } = await supabase
    .from("clinical_assessments")
    .insert({
      episode_id,
      is_standalone: false,
      vital_signs,
      findings,
      complementary,
      suggestions,
      summary,
      created_by: user!.id,
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase
    .from("patient_episodes")
    .update({
      initial_assessment: summary,
      weight: vital_signs.weight?.trim() || episode.weight,
      updated_at: new Date().toISOString(),
    })
    .eq("id", episode_id);

  return NextResponse.json({ assessment, suggestions, summary }, { status: 201 });
}
