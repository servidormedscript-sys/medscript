import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import {
  MEDICATION_URGENT_WINDOW_MINUTES,
  buildMedicationAlerts,
} from "@/lib/dashboard/overview";
import { fetchCareItemsByEpisode } from "@/lib/patient-care-fetch";
import type { KanbanEpisode } from "@/lib/types/patient";

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;

  const { data, error } = await supabase
    .from("patient_episodes")
    .select(
      `
      *,
      patient:patients (*)
    `
    )
    .in("status", ["triagem", "em_observacao", "internado", "alta_recente"])
    .is("archived_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const episodes = (data ?? []).filter(
    (episode) => episode.patient?.admin_id === adminId
  ) as KanbanEpisode[];

  const episodeIds = episodes.map((episode) => episode.id);

  try {
    const care = await fetchCareItemsByEpisode(supabase, episodeIds);
    const alerts = buildMedicationAlerts(
      episodes,
      care.itemsByEpisode,
      new Date(),
      MEDICATION_URGENT_WINDOW_MINUTES
    );

    return NextResponse.json({ alerts });
  } catch (careError) {
    const message =
      careError instanceof Error ? careError.message : "Erro ao carregar alertas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
