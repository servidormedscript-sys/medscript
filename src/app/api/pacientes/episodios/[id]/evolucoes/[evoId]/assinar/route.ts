import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { recordSignedEvolutionSideEffects } from "@/lib/inpatient/evolution-sign";
import type { EvolutionDraftMode } from "@/lib/inpatient/evolution-context";
import type { EpisodeEvolution } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string; evoId: string }> };

function mapRow(row: Record<string, unknown>): EpisodeEvolution {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    content_html: String(row.content_html ?? ""),
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
    signed_at: row.signed_at != null ? String(row.signed_at) : null,
    signed_by: row.signed_by != null ? String(row.signed_by) : null,
  };
}

export async function POST(request: Request, context: RouteContext) {
  const { id: episodeId, evoId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: { draft_mode?: EvolutionDraftMode } = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as { draft_mode?: EvolutionDraftMode };
    }
  } catch {
    body = {};
  }

  const { supabase, user } = result.session;
  const now = new Date().toISOString();

  const { data: existing, error: fetchErr } = await supabase
    .from("episode_evolutions")
    .select("*")
    .eq("id", evoId)
    .eq("episode_id", episodeId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Evolução não encontrada." }, { status: 404 });
  }
  if (existing.signed_at) {
    return NextResponse.json(
      { error: "Esta evolução já está assinada." },
      { status: 400 },
    );
  }

  const { data: row, error } = await supabase
    .from("episode_evolutions")
    .update({
      signed_at: now,
      signed_by: user.id,
    })
    .eq("id", evoId)
    .eq("episode_id", episodeId)
    .is("signed_at", null)
    .select("*")
    .single();

  if (error || !row) {
    return NextResponse.json(
      { error: error?.message ?? "Não foi possível assinar." },
      { status: 500 },
    );
  }

  const evolution = mapRow(row as Record<string, unknown>);
  await recordSignedEvolutionSideEffects(supabase, {
    episode_id: episodeId,
    evolution_id: evolution.id,
    content_html: evolution.content_html,
    user_id: user.id,
    draft_mode: body.draft_mode ?? null,
  });

  return NextResponse.json({ evolution });
}
