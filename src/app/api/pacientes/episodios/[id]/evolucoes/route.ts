import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { recordSignedEvolutionSideEffects } from "@/lib/inpatient/evolution-sign";
import type { EvolutionDraftMode } from "@/lib/inpatient/evolution-context";
import { mapEvolutionRow } from "@/lib/inpatient/evolution-utils";
import { refreshEpisodeRiskLevel } from "@/lib/inpatient/sync-episode-risk";

type RouteContext = { params: Promise<{ id: string }> };

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
      mapEvolutionRow(row as Record<string, unknown>),
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
    addendum_of_id?: string;
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

  let addendumOfId: string | null = null;
  if (body.addendum_of_id?.trim()) {
    const parentId = body.addendum_of_id.trim();
    const { data: parent } = await supabase
      .from("episode_evolutions")
      .select("id, signed_at")
      .eq("id", parentId)
      .eq("episode_id", episodeId)
      .maybeSingle();
    if (!parent?.signed_at) {
      return NextResponse.json(
        { error: "Adendo só pode referenciar evolução já assinada." },
        { status: 400 },
      );
    }
    addendumOfId = parentId;
    if (signNow) {
      return NextResponse.json(
        { error: "Salve o adendo como rascunho antes de assinar." },
        { status: 400 },
      );
    }
  }

  const { data: row, error } = await supabase
    .from("episode_evolutions")
    .insert({
      episode_id: episodeId,
      content_html: html,
      created_by: user.id,
      signed_at: signNow ? now : null,
      signed_by: signNow ? user.id : null,
      addendum_of_id: addendumOfId,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const evolution = mapEvolutionRow(row as Record<string, unknown>);

  if (signNow) {
    await recordSignedEvolutionSideEffects(supabase, {
      episode_id: episodeId,
      evolution_id: evolution.id,
      content_html: html,
      user_id: user.id,
      draft_mode: body.draft_mode ?? null,
    });
    const patient = result.episode.patient;
    await refreshEpisodeRiskLevel(supabase, episodeId, {
      admissionAt: result.episode.created_at,
      birthDate: patient?.birth_date ?? null,
    });
  }

  return NextResponse.json({ evolution });
}
