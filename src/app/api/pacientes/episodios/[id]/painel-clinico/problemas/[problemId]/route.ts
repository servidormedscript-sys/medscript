import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import type { EpisodeProblem } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string; problemId: string }> };

function mapProblem(row: Record<string, unknown>): EpisodeProblem {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    text: String(row.text),
    active: Boolean(row.active),
    started_at: String(row.started_at),
    resolved_at: row.resolved_at != null ? String(row.resolved_at) : null,
    created_at: String(row.created_at),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: episodeId, problemId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: { text?: string; active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.text !== undefined) {
    const text = body.text.trim();
    if (!text) {
      return NextResponse.json({ error: "Texto inválido." }, { status: 400 });
    }
    patch.text = text;
  }
  if (body.active !== undefined) {
    patch.active = body.active;
    patch.resolved_at = body.active ? null : new Date().toISOString();
  }

  const { supabase } = result.session;

  const { data, error } = await supabase
    .from("episode_problems")
    .update(patch)
    .eq("id", problemId)
    .eq("episode_id", episodeId)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Problema não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ problem: mapProblem(data as Record<string, unknown>) });
}
