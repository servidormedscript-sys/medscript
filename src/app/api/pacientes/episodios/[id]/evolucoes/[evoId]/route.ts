import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { mapEvolutionRow } from "@/lib/inpatient/evolution-utils";

type RouteContext = { params: Promise<{ id: string; evoId: string }> };

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

  let body: { content_html?: string; addendum_reason?: string };
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

  const patch: { content_html: string; addendum_reason?: string } = {
    content_html: html,
  };
  if (existing.addendum_of_id) {
    const reason = body.addendum_reason?.trim() ?? "";
    if (!reason) {
      return NextResponse.json(
        { error: "Informe o motivo do adendo." },
        { status: 400 },
      );
    }
    patch.addendum_reason = reason;
  }

  const { data: row, error } = await supabase
    .from("episode_evolutions")
    .update(patch)
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
    evolution: mapEvolutionRow(row as Record<string, unknown>),
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
