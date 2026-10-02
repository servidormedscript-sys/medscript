import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import type { EpisodeHandoffTask } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string; taskId: string }> };

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

export async function PATCH(request: Request, context: RouteContext) {
  const { id: episodeId, taskId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: { completed?: boolean; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { supabase } = result.session;
  const patch: Record<string, unknown> = {};

  if (body.text !== undefined) {
    const text = body.text.trim();
    if (!text) {
      return NextResponse.json({ error: "Texto inválido." }, { status: 400 });
    }
    patch.text = text;
  }

  if (body.completed !== undefined) {
    patch.completed = body.completed;
    patch.completed_at = body.completed ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from("episode_handoff_tasks")
    .update(patch)
    .eq("id", taskId)
    .eq("episode_id", episodeId)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Tarefa não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ task: mapTask(data as Record<string, unknown>) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: episodeId, taskId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  const { supabase } = result.session;

  const { error } = await supabase
    .from("episode_handoff_tasks")
    .delete()
    .eq("id", taskId)
    .eq("episode_id", episodeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
