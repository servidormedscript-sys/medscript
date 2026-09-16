import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { fetchCareItemsByEpisode } from "@/lib/patient-care-fetch";
import type { EpisodeDocument, PatientDocumentBundle } from "@/lib/patient-documents/types";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;
  const { id: patientId } = await context.params;
  const episodeId = new URL(request.url).searchParams.get("episode_id");

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
    .eq("admin_id", adminId!)
    .single();

  if (error || !patient) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }

  let episodes = (patient.patient_episodes ?? []).sort(
    (a: { episode_number: number }, b: { episode_number: number }) =>
      b.episode_number - a.episode_number
  );

  if (episodeId) {
    episodes = episodes.filter((ep: { id: string }) => ep.id === episodeId);
    if (episodes.length === 0) {
      return NextResponse.json({ error: "Ficha não encontrada." }, { status: 404 });
    }
  }

  const episodeIds = episodes.map((ep: { id: string }) => ep.id);

  let assessmentsByEpisode: Record<string, EpisodeDocument["assessments"]> = {};

  let careItemsByEpisode: Record<string, EpisodeDocument["care_items"]> = {};

  if (episodeIds.length > 0) {
    try {
      const care = await fetchCareItemsByEpisode(supabase, episodeIds);
      careItemsByEpisode = care.itemsByEpisode;
    } catch (careError) {
      const message =
        careError instanceof Error ? careError.message : "Erro ao carregar resumo.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (episodeIds.length > 0) {
    const { data: assessments, error: assessmentsError } = await supabase
      .from("clinical_assessments")
      .select("*")
      .in("episode_id", episodeIds)
      .eq("is_standalone", false)
      .order("created_at", { ascending: false });

    if (assessmentsError) {
      return NextResponse.json({ error: assessmentsError.message }, { status: 500 });
    }

    assessmentsByEpisode = (assessments ?? []).reduce<
      Record<string, EpisodeDocument["assessments"]>
    >((acc, item) => {
      if (!item.episode_id) return acc;
      if (!acc[item.episode_id]) acc[item.episode_id] = [];
      acc[item.episode_id].push(item);
      return acc;
    }, {});
  }

  const bundle: PatientDocumentBundle = {
    patient: {
      id: patient.id,
      admin_id: patient.admin_id,
      full_name: patient.full_name,
      cpf: patient.cpf,
      birth_date: patient.birth_date,
      sex: patient.sex,
      is_archived: patient.is_archived,
      created_at: patient.created_at,
      updated_at: patient.updated_at,
    },
    episodes: episodes.map((episode: EpisodeDocument) => ({
      ...episode,
      assessments: assessmentsByEpisode[episode.id] ?? [],
      care_items: careItemsByEpisode[episode.id] ?? [],
    })),
  };

  return NextResponse.json(bundle);
}
