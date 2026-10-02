import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import {
  emptyPhysicalExamSystems,
  parsePhysicalExamSystems,
} from "@/lib/inpatient/physical-exam-defaults";
import { appendTimelineEvent } from "@/lib/inpatient/timeline-db";
import type { EpisodePhysicalExam } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

function mapRow(row: Record<string, unknown>): EpisodePhysicalExam {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    recorded_at: String(row.recorded_at),
    without_changes: Boolean(row.without_changes),
    systems: parsePhysicalExamSystems(row.systems),
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

  const { data: rows, error } = await supabase
    .from("episode_physical_exams")
    .select("*")
    .eq("episode_id", episodeId)
    .order("recorded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    exams: (rows ?? []).map((row) => mapRow(row as Record<string, unknown>)),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const withoutChanges = Boolean(body.without_changes);
  const systems = withoutChanges
    ? parsePhysicalExamSystems(body.systems)
    : parsePhysicalExamSystems(body.systems ?? emptyPhysicalExamSystems());

  if (!withoutChanges && !body.systems) {
    return NextResponse.json(
      { error: "Dados do exame físico são obrigatórios." },
      { status: 400 },
    );
  }

  const { supabase, user } = result.session;

  const { data: row, error } = await supabase
    .from("episode_physical_exams")
    .insert({
      episode_id: episodeId,
      recorded_at:
        typeof body.recorded_at === "string"
          ? body.recorded_at
          : new Date().toISOString(),
      without_changes: withoutChanges,
      systems,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const exam = mapRow(row as Record<string, unknown>);
  await appendTimelineEvent(supabase, {
    episode_id: episodeId,
    event_type: "exame_fisico",
    summary_text: exam.without_changes
      ? "Exame físico: sem alterações"
      : "Exame físico registrado",
    occurred_at: exam.recorded_at,
    source_id: exam.id,
  });

  return NextResponse.json({ exam });
}
