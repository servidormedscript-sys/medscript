import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import type { EpisodeHandoffTask } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

function mapTask(row: Record<string, unknown>): EpisodeHandoffTask {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    text: String(row.text),
    completed: Boolean(row.completed),
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
    completed_at: row.completed_at != null ? String(row.completed_at) : null,
  };
}

export async function POST(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Texto da pendência é obrigatório." }, { status: 400 });
  }

  const { supabase, user } = result.session;

  const { data, error } = await supabase
    .from("episode_handoff_tasks")
    .insert({
      episode_id: episodeId,
      text,
      created_by: user!.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { task: mapTask(data as Record<string, unknown>) },
    { status: 201 },
  );
}
