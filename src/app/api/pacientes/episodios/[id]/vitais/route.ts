import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { appendTimelineEvent } from "@/lib/inpatient/timeline-db";
import { summarizeVitalTimeline } from "@/lib/inpatient/timeline-summaries";
import { parseVitalRecordInput } from "@/lib/inpatient/validate-vital-input";
import type { EpisodeVitalRecord } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

function mapRow(row: Record<string, unknown>): EpisodeVitalRecord {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    recorded_at: String(row.recorded_at),
    pas: row.pas != null ? Number(row.pas) : null,
    pad: row.pad != null ? Number(row.pad) : null,
    fc: row.fc != null ? Number(row.fc) : null,
    fr: row.fr != null ? Number(row.fr) : null,
    spo2: row.spo2 != null ? Number(row.spo2) : null,
    temperature: row.temperature != null ? Number(row.temperature) : null,
    glasgow: row.glasgow != null ? Number(row.glasgow) : null,
    diurese_ml: row.diurese_ml != null ? Number(row.diurese_ml) : null,
    observation: row.observation != null ? String(row.observation) : null,
    o2_type: row.o2_type as EpisodeVitalRecord["o2_type"],
    o2_flow_lmin:
      row.o2_flow_lmin != null ? Number(row.o2_flow_lmin) : null,
    central_venous_access: Boolean(row.central_venous_access),
    iot: Boolean(row.iot),
    monitoring: Boolean(row.monitoring),
    care_location: row.care_location as EpisodeVitalRecord["care_location"],
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  const { supabase } = result.session;

  const { data: rows, error } = await supabase
    .from("episode_vital_records")
    .select("*")
    .eq("episode_id", episodeId)
    .order("recorded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const records = (rows ?? []).map((row) => mapRow(row as Record<string, unknown>));

  return NextResponse.json({ records });
}

export async function POST(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = parseVitalRecordInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data } = parsed;
  const { supabase, user } = result.session;

  const insert = {
    episode_id: episodeId,
    recorded_at: data.recorded_at ?? new Date().toISOString(),
    pas: data.pas,
    pad: data.pad,
    fc: data.fc,
    fr: data.fr,
    spo2: data.spo2,
    temperature: data.temperature,
    glasgow: data.glasgow,
    diurese_ml: data.diurese_ml,
    observation: data.observation?.trim() || null,
    o2_type: data.o2_type ?? "ar_ambiente",
    o2_flow_lmin: data.o2_flow_lmin,
    central_venous_access: data.central_venous_access ?? false,
    iot: data.iot ?? false,
    monitoring: data.monitoring ?? false,
    care_location: data.care_location ?? "enfermaria",
    created_by: user.id,
  };

  const { data: row, error } = await supabase
    .from("episode_vital_records")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const record = mapRow(row as Record<string, unknown>);
  await appendTimelineEvent(supabase, {
    episode_id: episodeId,
    event_type: "vitais",
    summary_text: summarizeVitalTimeline(record),
    occurred_at: record.recorded_at,
    source_id: record.id,
  });

  return NextResponse.json({ record });
}
