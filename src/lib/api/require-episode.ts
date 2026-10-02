import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import { computeInternationDay } from "@/lib/inpatient/internation-day";
import type { Patient, PatientEpisode } from "@/lib/types/patient";

export { computeInternationDay };

export type EpisodeWithPatient = PatientEpisode & { patient: Patient };

const CHART_ALLOWED_STATUSES = new Set([
  "internado",
  "alta_recente",
  "em_observacao",
]);

export async function getEpisodeForOrg(episodeId: string) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) {
    return { error: session.error };
  }

  const { supabase, adminId } = session;

  const { data: episode, error } = await supabase
    .from("patient_episodes")
    .select("*, patient:patients (*)")
    .eq("id", episodeId)
    .single();

  if (error || !episode || episode.patient?.admin_id !== adminId) {
    return {
      error: NextResponse.json({ error: "Ficha não encontrada." }, { status: 404 }),
    };
  }

  return {
    session,
    episode: episode as EpisodeWithPatient,
  };
}

export function assertChartAccess(episode: EpisodeWithPatient): NextResponse | null {
  if (episode.archived_at) {
    return NextResponse.json(
      { error: "Esta ficha está arquivada." },
      { status: 400 },
    );
  }
  if (!CHART_ALLOWED_STATUSES.has(episode.status)) {
    return NextResponse.json(
      {
        error:
          "O prontuário de internação está disponível para pacientes em observação, internados ou em alta recente.",
      },
      { status: 403 },
    );
  }
  return null;
}
