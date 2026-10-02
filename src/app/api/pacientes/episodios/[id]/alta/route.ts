import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import type { EpisodeDischarge } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

function mapRow(row: Record<string, unknown>): EpisodeDischarge {
  return {
    episode_id: String(row.episode_id),
    summary_text: String(row.summary_text ?? ""),
    orientations_text: String(row.orientations_text ?? ""),
    transfer_note: String(row.transfer_note ?? ""),
    confirmed_at: row.confirmed_at != null ? String(row.confirmed_at) : null,
    confirmed_by: row.confirmed_by != null ? String(row.confirmed_by) : null,
    alta_days: row.alta_days != null ? Number(row.alta_days) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

const empty = (episodeId: string): EpisodeDischarge => ({
  episode_id: episodeId,
  summary_text: "",
  orientations_text: "",
  transfer_note: "",
  confirmed_at: null,
  confirmed_by: null,
  alta_days: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export async function GET(_request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  const { supabase } = result.session;

  const { data, error } = await supabase
    .from("episode_discharge")
    .select("*")
    .eq("episode_id", episodeId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("episode_med_reconciliation")
    .select("id", { count: "exact", head: true })
    .eq("episode_id", episodeId)
    .eq("status", "pendente");

  return NextResponse.json({
    discharge: data ? mapRow(data as Record<string, unknown>) : empty(episodeId),
    pending_reconciliation: count ?? 0,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  if (result.episode.status !== "internado") {
    return NextResponse.json(
      { error: "Documento de alta só pode ser editado com paciente internado." },
      { status: 400 },
    );
  }

  let body: {
    summary_text?: string;
    orientations_text?: string;
    transfer_note?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { supabase } = result.session;
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("episode_discharge")
    .select("confirmed_at")
    .eq("episode_id", episodeId)
    .maybeSingle();

  if (existing?.confirmed_at) {
    return NextResponse.json(
      { error: "Alta já confirmada — documento não pode ser alterado." },
      { status: 400 },
    );
  }

  const patch = {
    summary_text: body.summary_text ?? "",
    orientations_text: body.orientations_text ?? "",
    transfer_note: body.transfer_note ?? "",
    updated_at: now,
  };

  let row;
  if (!existing) {
    const { data, error } = await supabase
      .from("episode_discharge")
      .insert({ episode_id: episodeId, ...patch })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    row = data;
  } else {
    const { data, error } = await supabase
      .from("episode_discharge")
      .update(patch)
      .eq("episode_id", episodeId)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    row = data;
  }

  return NextResponse.json({
    discharge: mapRow(row as Record<string, unknown>),
  });
}
