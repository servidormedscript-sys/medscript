import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import type { BaselineSnapshot } from "@/lib/clinical/patient-grave-scoring";

export async function GET(request: Request) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const episodeId = new URL(request.url).searchParams.get("episode_id");
  if (!episodeId) {
    return NextResponse.json({ error: "episode_id é obrigatório." }, { status: 400 });
  }

  const { supabase, adminId } = session;
  const { data: episode, error } = await supabase
    .from("patient_episodes")
    .select("grave_baseline, patient:patients (*)")
    .eq("id", episodeId)
    .single();

  if (error || !episode) {
    return NextResponse.json({ error: "Episódio não encontrado." }, { status: 404 });
  }

  const patient = episode.patient as unknown as { admin_id: string } | null;
  if (patient?.admin_id !== adminId) {
    return NextResponse.json({ error: "Episódio não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ baseline: episode.grave_baseline ?? null });
}

export async function PUT(request: Request) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  let body: { episode_id?: string; baseline?: BaselineSnapshot | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { episode_id, baseline } = body;
  if (!episode_id) {
    return NextResponse.json({ error: "episode_id é obrigatório." }, { status: 400 });
  }

  const { supabase, adminId } = session;
  const { data: episode, error: fetchError } = await supabase
    .from("patient_episodes")
    .select("patient:patients (*)")
    .eq("id", episode_id)
    .single();

  if (fetchError || !episode) {
    return NextResponse.json({ error: "Episódio não encontrado." }, { status: 404 });
  }

  const owner = episode.patient as unknown as { admin_id: string } | null;
  if (owner?.admin_id !== adminId) {
    return NextResponse.json({ error: "Episódio não encontrado." }, { status: 404 });
  }

  const { error } = await supabase
    .from("patient_episodes")
    .update({
      grave_baseline: baseline,
      updated_at: new Date().toISOString(),
    })
    .eq("id", episode_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, baseline });
}
