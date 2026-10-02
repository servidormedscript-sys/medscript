import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
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

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: episodeId, evoId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: { content_html?: string };
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

  const { supabase } = result.session;

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
      { error: "Evoluções assinadas não podem ser editadas." },
      { status: 403 },
    );
  }

  const { data: row, error } = await supabase
    .from("episode_evolutions")
    .update({ content_html: html })
    .eq("id", evoId)
    .eq("episode_id", episodeId)
    .is("signed_at", null)
    .select("*")
    .single();

  if (error || !row) {
    return NextResponse.json(
      { error: error?.message ?? "Não foi possível atualizar o rascunho." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    evolution: mapRow(row as Record<string, unknown>),
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: episodeId, evoId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  const { supabase } = result.session;

  const { error } = await supabase
    .from("episode_evolutions")
    .delete()
    .eq("id", evoId)
    .eq("episode_id", episodeId)
    .is("signed_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
