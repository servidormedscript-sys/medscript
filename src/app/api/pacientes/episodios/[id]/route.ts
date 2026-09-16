import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;
  const { id: episodeId } = await context.params;

  let body: {
    weight?: string;
    bed?: string;
    diagnosis?: string;
    allergies?: string;
    medications?: string;
    initial_assessment?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { data: episode } = await supabase
    .from("patient_episodes")
    .select("*, patient:patients!inner(admin_id, is_archived)")
    .eq("id", episodeId)
    .single();

  if (!episode || episode.patient?.admin_id !== adminId) {
    return NextResponse.json({ error: "Ficha não encontrada." }, { status: 404 });
  }

  if (episode.archived_at) {
    return NextResponse.json(
      { error: "Não é possível editar uma ficha arquivada." },
      { status: 400 }
    );
  }

  const updates: Record<string, string | null> = {};

  if (body.weight !== undefined) {
    updates.weight = body.weight.trim() || null;
  }
  if (body.bed !== undefined) {
    updates.bed = body.bed.trim() || null;
  }
  if (body.diagnosis !== undefined) {
    updates.diagnosis = body.diagnosis.trim() || null;
  }
  if (body.allergies !== undefined) {
    updates.allergies = body.allergies.trim() || null;
  }
  if (body.medications !== undefined) {
    updates.medications = body.medications.trim() || null;
  }
  if (body.initial_assessment !== undefined) {
    updates.initial_assessment = body.initial_assessment.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("patient_episodes")
    .update(updates)
    .eq("id", episodeId)
    .select("*, patient:patients (*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ episode: updated });
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;
  const { id: episodeId } = await context.params;

  const { data: episode, error } = await supabase
    .from("patient_episodes")
    .select("*, patient:patients (*)")
    .eq("id", episodeId)
    .single();

  if (error || !episode || episode.patient?.admin_id !== adminId) {
    return NextResponse.json({ error: "Ficha não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ episode });
}
