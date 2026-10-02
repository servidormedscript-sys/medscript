import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { recordSignedEvolutionSideEffects } from "@/lib/inpatient/evolution-sign";
import type { EpisodeEvolution } from "@/lib/types/inpatient-chart";
import type { EvolutionDraftMode } from "@/lib/inpatient/evolution-context";

type RouteContext = { params: Promise<{ id: string }> };

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

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  const { supabase } = result.session;

  const { data: rows, error } = await supabase
    .from("episode_evolutions")
    .select("*")
    .eq("episode_id", episodeId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    evolutions: (rows ?? []).map((row) =>
      mapRow(row as Record<string, unknown>),
    ),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: {
    content_html?: string;
    draft_mode?: EvolutionDraftMode;
    sign?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const html = body.content_html ?? "";
  if (!stripHtml(html)) {
    return NextResponse.json(
      { error: "A evolução não pode estar vazia." },
      { status: 400 },
    );
  }

  const { supabase, user } = result.session;
  const signNow = body.sign !== false;
  const now = new Date().toISOString();

  const { data: row, error } = await supabase
    .from("episode_evolutions")
    .insert({
      episode_id: episodeId,
      content_html: html,
      created_by: user.id,
      signed_at: signNow ? now : null,
      signed_by: signNow ? user.id : null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const evolution = mapRow(row as Record<string, unknown>);

  if (signNow) {
    await recordSignedEvolutionSideEffects(supabase, {
      episode_id: episodeId,
      evolution_id: evolution.id,
      content_html: html,
      user_id: user.id,
      draft_mode: body.draft_mode ?? null,
    });
  }

  return NextResponse.json({ evolution });
}
