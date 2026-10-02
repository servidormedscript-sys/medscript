import { NextResponse } from "next/server";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { appendTimelineEvent } from "@/lib/inpatient/timeline-db";
import { summarizeConductTimelineChange } from "@/lib/inpatient/timeline-summaries";
import type {
  CodeStatus,
  CoreStatus,
  EpisodeConduct,
  EpisodeHandoffTask,
  TransferClass,
} from "@/lib/types/inpatient-chart";

type RouteContext = { params: Promise<{ id: string }> };

const CODE_VALUES: CodeStatus[] = ["reanimacao_plena", "onr", "conforto"];

function mapConduct(row: Record<string, unknown>): EpisodeConduct {
  return {
    episode_id: String(row.episode_id),
    code_status: row.code_status as CodeStatus,
    code_justification: row.code_justification != null
      ? String(row.code_justification)
      : null,
    code_updated_at: row.code_updated_at != null
      ? String(row.code_updated_at)
      : null,
    code_updated_by: row.code_updated_by != null
      ? String(row.code_updated_by)
      : null,
    conduct_text: String(row.conduct_text ?? ""),
    contingency_plan: String(row.contingency_plan ?? ""),
    resource_needed: String(row.resource_needed ?? ""),
    unit_limitations:
      (row.unit_limitations as Record<string, boolean>) ?? {},
    unit_limitation_other: String(row.unit_limitation_other ?? ""),
    core_status: (row.core_status as CoreStatus) ?? "nenhum",
    vaga_judicializada: Boolean(row.vaga_judicializada),
    judicial_started_at:
      row.judicial_started_at != null
        ? String(row.judicial_started_at)
        : null,
    judicial_process: String(row.judicial_process ?? ""),
    transfer_class: (row.transfer_class as TransferClass) ?? "sem",
    transfer_class_justification: String(
      row.transfer_class_justification ?? "",
    ),
    transfer_class_confirmed: Boolean(row.transfer_class_confirmed),
    no_specific_treatment: Boolean(row.no_specific_treatment),
    updated_at: String(row.updated_at),
  };
}

function mapTask(row: Record<string, unknown>): EpisodeHandoffTask {
  return {
    id: String(row.id),
    episode_id: String(row.episode_id),
    text: String(row.text),
    completed: Boolean(row.completed),
    created_by: row.created_by != null ? String(row.created_by) : null,
    created_at: String(row.created_at),
    completed_at: row.completed_at != null ? String(row.completed_at) : null,
  };
}

const DEFAULT_CONDUCT = (episodeId: string): EpisodeConduct => ({
  episode_id: episodeId,
  code_status: "reanimacao_plena",
  code_justification: null,
  code_updated_at: null,
  code_updated_by: null,
  conduct_text: "",
  contingency_plan: "",
  resource_needed: "",
  unit_limitations: {},
  unit_limitation_other: "",
  core_status: "nenhum",
  vaga_judicializada: false,
  judicial_started_at: null,
  judicial_process: "",
  transfer_class: "sem",
  transfer_class_justification: "",
  transfer_class_confirmed: false,
  no_specific_treatment: false,
  updated_at: new Date().toISOString(),
});

export async function GET(_request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  const { supabase } = result.session;

  const [conductRes, tasksRes] = await Promise.all([
    supabase.from("episode_conduct").select("*").eq("episode_id", episodeId).maybeSingle(),
    supabase
      .from("episode_handoff_tasks")
      .select("*")
      .eq("episode_id", episodeId)
      .order("completed", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  if (conductRes.error) {
    return NextResponse.json({ error: conductRes.error.message }, { status: 500 });
  }
  if (tasksRes.error) {
    return NextResponse.json({ error: tasksRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    conduct: conductRes.data
      ? mapConduct(conductRes.data as Record<string, unknown>)
      : DEFAULT_CONDUCT(episodeId),
    tasks: (tasksRes.data ?? []).map((r) =>
      mapTask(r as Record<string, unknown>),
    ),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  let body: {
    code_status?: CodeStatus;
    code_justification?: string | null;
    conduct_text?: string;
    contingency_plan?: string;
    resource_needed?: string;
    unit_limitations?: Record<string, boolean>;
    unit_limitation_other?: string;
    core_status?: CoreStatus;
    vaga_judicializada?: boolean;
    judicial_started_at?: string | null;
    judicial_process?: string;
    transfer_class?: TransferClass;
    transfer_class_justification?: string;
    transfer_class_confirmed?: boolean;
    no_specific_treatment?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  if (body.code_status && !CODE_VALUES.includes(body.code_status)) {
    return NextResponse.json({ error: "Status de código inválido." }, { status: 400 });
  }

  const { supabase, user } = result.session;
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("episode_conduct")
    .select("*")
    .eq("episode_id", episodeId)
    .maybeSingle();

  const beforeConduct = existing
    ? mapConduct(existing as Record<string, unknown>)
    : DEFAULT_CONDUCT(episodeId);

  const patch: Record<string, unknown> = { updated_at: now };

  if (body.conduct_text !== undefined) patch.conduct_text = body.conduct_text;
  if (body.contingency_plan !== undefined) {
    patch.contingency_plan = body.contingency_plan;
  }
  if (body.code_status !== undefined) {
    patch.code_status = body.code_status;
    patch.code_justification = body.code_justification?.trim() || null;
    patch.code_updated_at = now;
    patch.code_updated_by = user!.id;
  } else if (body.code_justification !== undefined) {
    patch.code_justification = body.code_justification?.trim() || null;
  }

  if (body.resource_needed !== undefined) {
    patch.resource_needed = body.resource_needed;
  }
  if (body.unit_limitations !== undefined) {
    patch.unit_limitations = body.unit_limitations;
  }
  if (body.unit_limitation_other !== undefined) {
    patch.unit_limitation_other = body.unit_limitation_other;
  }
  if (body.core_status !== undefined) patch.core_status = body.core_status;
  if (body.vaga_judicializada !== undefined) {
    patch.vaga_judicializada = body.vaga_judicializada;
  }
  if (body.judicial_started_at !== undefined) {
    patch.judicial_started_at = body.judicial_started_at;
  }
  if (body.judicial_process !== undefined) {
    patch.judicial_process = body.judicial_process;
  }
  if (body.transfer_class !== undefined) {
    patch.transfer_class = body.transfer_class;
  }
  if (body.transfer_class_justification !== undefined) {
    patch.transfer_class_justification = body.transfer_class_justification;
  }
  if (body.transfer_class_confirmed !== undefined) {
    patch.transfer_class_confirmed = body.transfer_class_confirmed;
  }
  if (body.no_specific_treatment !== undefined) {
    patch.no_specific_treatment = body.no_specific_treatment;
  }

  let row;
  if (!existing) {
    const { data, error } = await supabase
      .from("episode_conduct")
      .insert({
        episode_id: episodeId,
        code_status: body.code_status ?? "reanimacao_plena",
        code_justification: body.code_justification?.trim() || null,
        code_updated_at: body.code_status ? now : null,
        code_updated_by: body.code_status ? user!.id : null,
        conduct_text: body.conduct_text ?? "",
        contingency_plan: body.contingency_plan ?? "",
        updated_at: now,
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    row = data;
  } else {
    const { data, error } = await supabase
      .from("episode_conduct")
      .update(patch)
      .eq("episode_id", episodeId)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    row = data;
  }

  const conduct = mapConduct(row as Record<string, unknown>);
  const timelineLines = summarizeConductTimelineChange(
    {
      code_status: body.code_status !== undefined ? beforeConduct.code_status : undefined,
      core_status: body.core_status !== undefined ? beforeConduct.core_status : undefined,
      vaga_judicializada:
        body.vaga_judicializada !== undefined
          ? beforeConduct.vaga_judicializada
          : undefined,
      transfer_class:
        body.transfer_class !== undefined ? beforeConduct.transfer_class : undefined,
      transfer_class_confirmed:
        body.transfer_class_confirmed !== undefined
          ? beforeConduct.transfer_class_confirmed
          : undefined,
    },
    conduct,
  );
  for (const line of timelineLines) {
    await appendTimelineEvent(supabase, {
      episode_id: episodeId,
      event_type: "conduta",
      summary_text: line,
    });
  }

  return NextResponse.json({ conduct });
}
