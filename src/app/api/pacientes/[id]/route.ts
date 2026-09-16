import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId, user } = session;
  const { id: patientId } = await context.params;

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .eq("admin_id", adminId)
    .single();

  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  if (!patient.is_archived) {
    return NextResponse.json(
      { error: "Este paciente já está ativo." },
      { status: 400 }
    );
  }

  const { data: lastEpisode } = await supabase
    .from("patient_episodes")
    .select("episode_number")
    .eq("patient_id", patientId)
    .order("episode_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextEpisodeNumber = (lastEpisode?.episode_number ?? 0) + 1;

  const { data: episode, error: episodeError } = await supabase
    .from("patient_episodes")
    .insert({
      patient_id: patientId,
      episode_number: nextEpisodeNumber,
      status: "triagem",
      status_started_at: new Date().toISOString(),
      triagem_seconds: 0,
      observacao_seconds: 0,
      internado_seconds: 0,
      created_by: user!.id,
    })    .select("*, patient:patients (*)")
    .single();

  if (episodeError) {
    return NextResponse.json({ error: episodeError.message }, { status: 500 });
  }

  await supabase
    .from("patients")
    .update({ is_archived: false })
    .eq("id", patientId);

  await supabase.from("patient_movements").insert({
    episode_id: episode.id,
    from_status: null,
    to_status: "triagem",
    report_text: `Paciente reativado. Nova ficha #${nextEpisodeNumber} iniciada em triagem.`,
    created_by: user!.id,
  });

  return NextResponse.json({ patient: { ...patient, is_archived: false }, episode });
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;
  const { id: patientId } = await context.params;

  const { data: patient, error } = await supabase
    .from("patients")
    .select(
      `
      *,
      patient_episodes (
        *,
        patient_movements (*)
      )
    `
    )
    .eq("id", patientId)
    .eq("admin_id", adminId)
    .single();

  if (error || !patient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ patient });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;
  const { id: patientId } = await context.params;

  let body: {
    full_name?: string;
    birth_date?: string;
    sex?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("admin_id", adminId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  const updates: Record<string, string> = {};

  if (body.full_name !== undefined) {
    const name = body.full_name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "Nome completo é obrigatório." },
        { status: 400 }
      );
    }
    updates.full_name = name;
  }

  if (body.birth_date !== undefined) {
    if (!body.birth_date) {
      return NextResponse.json(
        { error: "Data de nascimento é obrigatória." },
        { status: 400 }
      );
    }
    updates.birth_date = body.birth_date;
  }

  if (body.sex !== undefined) {
    if (!["masculino", "feminino", "outro"].includes(body.sex)) {
      return NextResponse.json({ error: "Sexo inválido." }, { status: 400 });
    }
    updates.sex = body.sex;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
  }

  const { data: patient, error } = await supabase
    .from("patients")
    .update(updates)
    .eq("id", patientId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ patient });
}
