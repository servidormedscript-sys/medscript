import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { buildDashboardOverview } from "@/lib/dashboard/overview";
import { fetchCareItemsByEpisode } from "@/lib/patient-care-fetch";
import type { KanbanEpisode } from "@/lib/types/patient";
import type { PatientCareItem } from "@/lib/types/patient-care";

function computeDaysRemaining(
  altaStartedAt: string | null,
  altaDays: number | null
): number | null {
  if (!altaStartedAt || !altaDays) return null;

  const start = new Date(altaStartedAt);
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + altaDays);

  const diff = Math.ceil(
    (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, diff);
}

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;

  await supabase.rpc("archive_expired_alta_patients");

  const { data, error } = await supabase
    .from("patient_episodes")
    .select(
      `
      *,
      patient:patients (*)
    `
    )
    .in("status", ["triagem", "em_observacao", "internado", "alta_recente"])
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const episodes = (data ?? [])
    .filter((episode) => episode.patient?.admin_id === adminId)
    .map((episode) => ({
      ...episode,
      days_remaining: computeDaysRemaining(episode.alta_started_at, episode.alta_days),
    })) as KanbanEpisode[];

  const episodeIds = episodes.map((episode) => episode.id);

  let itemsByEpisode: Record<string, PatientCareItem[]> = {};

  try {
    const care = await fetchCareItemsByEpisode(supabase, episodeIds);
    itemsByEpisode = care.itemsByEpisode;
  } catch (careError) {
    const message =
      careError instanceof Error ? careError.message : "Erro ao carregar resumo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const overview = buildDashboardOverview(episodes, itemsByEpisode);

  return NextResponse.json(overview);
}
