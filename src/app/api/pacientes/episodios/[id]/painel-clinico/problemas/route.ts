import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import type { EpisodeProblem } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

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
    return NextResponse.json({ error: "Descrição do problema é obrigatória." }, { status: 400 });
  }

  const { supabase } = result.session;

  const { data, error } = await supabase
    .from("episode_problems")
    .insert({ episode_id: episodeId, text, active: true })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { problem: mapProblem(data as Record<string, unknown>) },
    { status: 201 },
  );
}
