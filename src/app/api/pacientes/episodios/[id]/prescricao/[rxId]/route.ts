import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { appendTimelineEvent } from "@/lib/inpatient/timeline-db";
import type { EpisodePrescription } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string; rxId: string }> };

function mapRx(row: Record<string, unknown>): EpisodePrescription {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    name: String(row.name),
    dose: String(row.dose ?? ""),
    route: String(row.route ?? ""),
    frequency: String(row.frequency ?? ""),
    indication: String(row.indication ?? ""),
    duration_days: row.duration_days != null ? Number(row.duration_days) : null,
    use_continuous: Boolean(row.use_continuous),
    started_at: String(row.started_at),
    suspended_at: row.suspended_at != null ? String(row.suspended_at) : null,
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: episodeId, rxId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  if (body.action !== "suspender") {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const { supabase } = result.session;
  const suspendedAt = new Date().toISOString();

  const { data: row, error } = await supabase
    .from("episode_prescriptions")
    .update({ suspended_at: suspendedAt })
    .eq("id", rxId)
    .eq("episode_id", episodeId)
    .is("suspended_at", null)
    .select("*")
    .single();

  if (error || !row) {
    return NextResponse.json(
      { error: error?.message ?? "Prescrição não encontrada." },
      { status: 404 },
    );
  }

  const prescription = mapRx(row as Record<string, unknown>);
  await appendTimelineEvent(supabase, {
    episode_id: episodeId,
    event_type: "prescricao_suspensao",
    summary_text: `Suspensão: ${prescription.name}`,
    occurred_at: suspendedAt,
    source_id: prescription.id,
  });

  return NextResponse.json({ prescription });
}
