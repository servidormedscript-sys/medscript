import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { appendTimelineEvent } from "@/lib/inpatient/timeline-db";
import { TREATMENT_RESPONSE_LABELS } from "@/lib/inpatient/treatment-response-format";
import type {
  EpisodeTreatmentResponse,
  TreatmentResponseStatus,
} from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

const VALID: TreatmentResponseStatus[] = [
  "melhora",
  "melhora_parcial",
  "sem_mudanca",
  "sem_resposta",
  "piora",
];

function mapRow(row: Record<string, unknown>): EpisodeTreatmentResponse {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    problem_id: String(row.problem_id),
    response_status: row.response_status as TreatmentResponseStatus,
    notes: String(row.notes ?? ""),
    other_measure: String(row.other_measure ?? ""),
    linked_prescription_ids: Array.isArray(row.linked_prescription_ids)
      ? (row.linked_prescription_ids as unknown[]).map(String)
      : [],
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
    updated_at:
      row.updated_at != null ? String(row.updated_at) : String(row.created_at),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  const { supabase } = result.session;
  const { data, error } = await supabase
    .from("episode_treatment_responses")
    .select("*")
    .eq("episode_id", episodeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    responses: (data ?? []).map((row) =>
      mapRow(row as Record<string, unknown>),
    ),
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: {
    problem_id?: string;
    response_status?: TreatmentResponseStatus;
    notes?: string;
    other_measure?: string;
    linked_prescription_ids?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const problemId = body.problem_id?.trim();
  if (!problemId) {
    return NextResponse.json(
      { error: "problem_id é obrigatório." },
      { status: 400 },
    );
  }

  const status = body.response_status;
  if (!status || !VALID.includes(status)) {
    return NextResponse.json(
      { error: "response_status inválido." },
      { status: 400 },
    );
  }

  const { supabase, user } = result.session;

  const { data: existing } = await supabase
    .from("episode_treatment_responses")
    .select("id")
    .eq("problem_id", problemId)
    .maybeSingle();

  const linkedIds = Array.isArray(body.linked_prescription_ids)
    ? body.linked_prescription_ids.map((id) => String(id).trim()).filter(Boolean)
    : [];

  const now = new Date().toISOString();
  const payload = {
    episode_id: episodeId,
    problem_id: problemId,
    response_status: status,
    notes: body.notes?.trim() ?? "",
    other_measure: body.other_measure?.trim() ?? "",
    linked_prescription_ids: linkedIds,
    created_by: user.id,
    updated_at: now,
  };

  let row: Record<string, unknown> | null = null;
  let error: { message: string } | null = null;

  if (existing?.id) {
    const res = await supabase
      .from("episode_treatment_responses")
      .update({
        response_status: status,
        notes: payload.notes,
        other_measure: payload.other_measure,
        linked_prescription_ids: linkedIds,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    row = res.data as Record<string, unknown> | null;
    error = res.error;
  } else {
    const res = await supabase
      .from("episode_treatment_responses")
      .insert(payload)
      .select("*")
      .single();
    row = res.data as Record<string, unknown> | null;
    error = res.error;
  }

  if (error || !row) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao salvar." },
      { status: 500 },
    );
  }

  const { data: problemRow } = await supabase
    .from("episode_problems")
    .select("text")
    .eq("id", problemId)
    .maybeSingle();

  await appendTimelineEvent(supabase, {
    episode_id: episodeId,
    event_type: "resposta_tratamento",
    summary_text: `Resposta ao tratamento (${TREATMENT_RESPONSE_LABELS[status]}): ${problemRow?.text ?? "problema"}`,
    source_id: String(row.id),
  });

  return NextResponse.json({ response: mapRow(row) });
}
