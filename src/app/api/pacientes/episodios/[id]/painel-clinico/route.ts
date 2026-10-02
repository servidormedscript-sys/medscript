import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import type { EpisodeComorbidities, EpisodeProblem } from "@/lib/types/inpatient-chart";

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

function mapComorbidities(
  episodeId: string,
  row: Record<string, unknown> | null,
): EpisodeComorbidities {
  if (!row) {
    return {
      episode_id: episodeId,
      flags: {},
      other_text: "",
      problems_seeded: false,
      updated_at: new Date().toISOString(),
    };
  }
  return {
    episode_id: episodeId,
    flags: (row.flags as Record<string, boolean>) ?? {},
    other_text: String(row.other_text ?? ""),
    problems_seeded: Boolean(row.problems_seeded),
    updated_at: String(row.updated_at),
  };
}

async function ensureAdmissionProblem(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  episodeId: string,
  diagnosis: string | null,
  comorbRow: EpisodeComorbidities,
) {
  const dx = diagnosis?.trim();
  if (!dx || comorbRow.problems_seeded) return;

  const { count } = await supabase
    .from("episode_problems")
    .select("id", { count: "exact", head: true })
    .eq("episode_id", episodeId);

  if ((count ?? 0) > 0) {
    await supabase
      .from("episode_comorbidities")
      .upsert({
        episode_id: episodeId,
        flags: comorbRow.flags,
        other_text: comorbRow.other_text,
        problems_seeded: true,
        updated_at: new Date().toISOString(),
      });
    return;
  }

  await supabase.from("episode_problems").insert({
    episode_id: episodeId,
    text: dx,
    active: true,
  });

  await supabase.from("episode_comorbidities").upsert({
    episode_id: episodeId,
    flags: comorbRow.flags,
    other_text: comorbRow.other_text,
    problems_seeded: true,
    updated_at: new Date().toISOString(),
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  const { supabase } = result.session;
  const diagnosis = result.episode.diagnosis;

  const [probRes, comRes] = await Promise.all([
    supabase
      .from("episode_problems")
      .select("*")
      .eq("episode_id", episodeId)
      .order("active", { ascending: false })
      .order("started_at", { ascending: false }),
    supabase
      .from("episode_comorbidities")
      .select("*")
      .eq("episode_id", episodeId)
      .maybeSingle(),
  ]);

  if (probRes.error) {
    return NextResponse.json({ error: probRes.error.message }, { status: 500 });
  }

  let comorbidities = mapComorbidities(
    episodeId,
    comRes.data as Record<string, unknown> | null,
  );

  await ensureAdmissionProblem(supabase, episodeId, diagnosis, comorbidities);

  const { data: problemsAfter } = await supabase
    .from("episode_problems")
    .select("*")
    .eq("episode_id", episodeId)
    .order("active", { ascending: false })
    .order("started_at", { ascending: false });

  const { data: comAfter } = await supabase
    .from("episode_comorbidities")
    .select("*")
    .eq("episode_id", episodeId)
    .maybeSingle();

  comorbidities = mapComorbidities(
    episodeId,
    comAfter as Record<string, unknown> | null,
  );

  return NextResponse.json({
    problems: (problemsAfter ?? []).map((p) =>
      mapProblem(p as Record<string, unknown>),
    ),
    comorbidities,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: { flags?: Record<string, boolean>; other_text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { supabase } = result.session;
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("episode_comorbidities")
    .select("problems_seeded")
    .eq("episode_id", episodeId)
    .maybeSingle();

  const payload = {
    episode_id: episodeId,
    flags: body.flags ?? {},
    other_text: body.other_text ?? "",
    problems_seeded: existing?.problems_seeded ?? false,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("episode_comorbidities")
    .upsert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    comorbidities: mapComorbidities(episodeId, data as Record<string, unknown>),
  });
}
