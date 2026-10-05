import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { parseCoreClinicalSnapshot } from "@/lib/inpatient/core-clinical-snapshot";
import type { EpisodeTreatmentResponse } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

function mapTreatment(row: Record<string, unknown>): EpisodeTreatmentResponse {
  const linked = row.linked_prescription_ids;
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    problem_id: String(row.problem_id),
    response_status: row.response_status as EpisodeTreatmentResponse["response_status"],
    notes: String(row.notes ?? ""),
    linked_prescription_ids: Array.isArray(linked)
      ? linked.map(String)
      : [],
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  const { supabase } = result.session;

  const [coreRes, timelineRes, treatmentRes] = await Promise.all([
    supabase
      .from("episode_core_generations")
      .select("id, created_at, generation_kind, clinical_snapshot")
      .eq("episode_id", episodeId)
      .order("created_at", { ascending: false }),
    supabase
      .from("episode_timeline_events")
      .select("occurred_at, event_type, summary_text")
      .eq("episode_id", episodeId)
      .order("occurred_at", { ascending: false })
      .limit(50),
    supabase
      .from("episode_treatment_responses")
      .select("*")
      .eq("episode_id", episodeId),
  ]);

  if (coreRes.error) {
    return NextResponse.json({ error: coreRes.error.message }, { status: 500 });
  }
  if (timelineRes.error) {
    return NextResponse.json(
      { error: timelineRes.error.message },
      { status: 500 },
    );
  }
  if (treatmentRes.error) {
    return NextResponse.json(
      { error: treatmentRes.error.message },
      { status: 500 },
    );
  }

  const coreRows = coreRes.data ?? [];
  const lastCore = coreRows[0] as Record<string, unknown> | undefined;
  const firstInicial = [...coreRows]
    .reverse()
    .find((r) => (r as { generation_kind?: string }).generation_kind === "core_inicial") as
    | Record<string, unknown>
    | undefined;

  let lastCoreSnapshot = null;
  for (const row of coreRows) {
    const snap = parseCoreClinicalSnapshot(
      (row as Record<string, unknown>).clinical_snapshot,
    );
    if (snap) {
      lastCoreSnapshot = snap;
      break;
    }
  }

  return NextResponse.json({
    core_generations_count: coreRows.length,
    last_core_generated_at: lastCore?.created_at ?? null,
    first_core_request_at: firstInicial?.created_at ?? null,
    last_core_clinical_snapshot: lastCoreSnapshot,
    stored_timeline: (timelineRes.data ?? []).map((row) => ({
      occurred_at: String((row as Record<string, unknown>).occurred_at),
      event_type: String((row as Record<string, unknown>).event_type),
      summary_text: String((row as Record<string, unknown>).summary_text ?? ""),
    })),
    treatment_responses: (treatmentRes.data ?? []).map((row) =>
      mapTreatment(row as Record<string, unknown>),
    ),
  });
}
