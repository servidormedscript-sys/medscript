import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { appendTimelineEvent } from "@/lib/inpatient/timeline-db";
import type { EpisodeLabPending } from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

function mapPending(row: Record<string, unknown>): EpisodeLabPending {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    label: String(row.label),
    analyte_key: row.analyte_key != null ? String(row.analyte_key) : null,
    requested_at: String(row.requested_at),
    expected_note:
      row.expected_note != null ? String(row.expected_note) : null,
    urgent: Boolean(row.urgent),
    fulfilled_at:
      row.fulfilled_at != null ? String(row.fulfilled_at) : null,
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
  };
}

export async function POST(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: {
    label?: string;
    analyte_key?: string;
    expected_note?: string;
    urgent?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const label = body.label?.trim();
  if (!label) {
    return NextResponse.json(
      { error: "Informe o tipo de exame." },
      { status: 400 },
    );
  }

  const { supabase, user } = result.session;

  const { data: row, error } = await supabase
    .from("episode_lab_pending")
    .insert({
      episode_id: episodeId,
      label,
      analyte_key: body.analyte_key?.trim() || null,
      expected_note: body.expected_note?.trim() || null,
      urgent: Boolean(body.urgent),
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pending = mapPending(row as Record<string, unknown>);
  await appendTimelineEvent(supabase, {
    episode_id: episodeId,
    event_type: "exame_solicitado",
    summary_text: `Solicitado: ${pending.label}${pending.urgent ? " (urgente)" : ""}`,
    occurred_at: pending.requested_at,
    source_id: pending.id,
  });

  return NextResponse.json({ pending });
}
