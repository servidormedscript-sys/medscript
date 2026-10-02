import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { appendTimelineEvent } from "@/lib/inpatient/timeline-db";
import type { EpisodeInternacao } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

function mapRow(row: Record<string, unknown>): EpisodeInternacao {
  return {
    episode_id: String(row.episode_id),
    summary_text: String(row.summary_text ?? ""),
    orientations_text: String(row.orientations_text ?? ""),
    finalized_at:
      row.finalized_at != null ? String(row.finalized_at) : null,
    finalized_by:
      row.finalized_by != null ? String(row.finalized_by) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function POST(_request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  if (result.episode.status !== "internado") {
    return NextResponse.json(
      { error: "Só é possível finalizar o documento com paciente internado." },
      { status: 400 },
    );
  }

  const { supabase, user } = result.session;
  const now = new Date().toISOString();

  const { data: discharge } = await supabase
    .from("episode_discharge")
    .select("confirmed_at")
    .eq("episode_id", episodeId)
    .maybeSingle();

  if (discharge?.confirmed_at) {
    return NextResponse.json(
      { error: "Alta já confirmada — documento não pode ser finalizado agora." },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from("episode_internacao")
    .select("*")
    .eq("episode_id", episodeId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { error: "Salve o documento de internação antes de finalizar." },
      { status: 400 },
    );
  }

  if (existing.finalized_at) {
    return NextResponse.json(
      { error: "Documento de internação já finalizado." },
      { status: 400 },
    );
  }

  const summary = String(existing.summary_text ?? "").trim();
  if (!summary) {
    return NextResponse.json(
      { error: "O resumo do documento não pode estar vazio." },
      { status: 400 },
    );
  }

  const { data: row, error } = await supabase
    .from("episode_internacao")
    .update({
      finalized_at: now,
      finalized_by: user.id,
      updated_at: now,
    })
    .eq("episode_id", episodeId)
    .is("finalized_at", null)
    .select("*")
    .single();

  if (error || !row) {
    return NextResponse.json(
      { error: error?.message ?? "Não foi possível finalizar." },
      { status: 500 },
    );
  }

  await appendTimelineEvent(supabase, {
    episode_id: episodeId,
    event_type: "internacao_finalizada",
    summary_text: "Documento de internação / AIH finalizado",
    occurred_at: now,
  });

  return NextResponse.json({
    internacao: mapRow(row as Record<string, unknown>),
  });
}
