import { NextResponse } from "next/server";
import { releaseOrganizationBedForEpisode } from "@/lib/inpatient/bed-sync";
import {
  assertChartAccess,
  getEpisodeForOrg,
} from "@/lib/api/require-episode";
import { appendTimelineEvent } from "@/lib/inpatient/timeline-db";
import { accumulateStatusSeconds, getCurrentPeriodSeconds } from "@/lib/patient-status-time";
import type { PatientStatus } from "@/lib/types/patient";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id: episodeId } = await context.params;
  const result = await getEpisodeForOrg(episodeId);
  if ("error" in result && result.error) return result.error;

  const denied = assertChartAccess(result.episode);
  if (denied) return denied;

  const episode = result.episode;
  if (episode.status !== "internado") {
    return NextResponse.json(
      { error: "Só é possível confirmar alta a partir do status internado." },
      { status: 400 },
    );
  }

  let body: {
    alta_days?: number;
    report_text?: string;
    summary_text?: string;
    orientations_text?: string;
    transfer_note?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const altaDays = body.alta_days;
  if (!altaDays || altaDays < 1) {
    return NextResponse.json(
      { error: "Informe o período em dias para alta recente (mínimo 1)." },
      { status: 400 },
    );
  }

  const report =
    body.report_text?.trim() ||
    [
      "Alta hospitalar confirmada pelo prontuário.",
      body.summary_text?.trim()
        ? `Resumo:\n${body.summary_text.trim()}`
        : null,
      body.orientations_text?.trim()
        ? `Orientações:\n${body.orientations_text.trim()}`
        : null,
    ]
      .filter(Boolean)
      .join("\n\n");

  const { supabase, adminId, user } = result.session;
  const nowIso = new Date().toISOString();

  const { data: existingDischarge } = await supabase
    .from("episode_discharge")
    .select("confirmed_at")
    .eq("episode_id", episodeId)
    .maybeSingle();

  if (existingDischarge?.confirmed_at) {
    return NextResponse.json({ error: "Alta já foi confirmada." }, { status: 400 });
  }

  const dischargePayload = {
    summary_text: body.summary_text ?? "",
    orientations_text: body.orientations_text ?? "",
    transfer_note: body.transfer_note ?? "",
    confirmed_at: nowIso,
    confirmed_by: user!.id,
    alta_days: altaDays,
    updated_at: nowIso,
  };

  if (!existingDischarge) {
    await supabase.from("episode_discharge").insert({
      episode_id: episodeId,
      ...dischargePayload,
    });
  } else {
    await supabase
      .from("episode_discharge")
      .update(dischargePayload)
      .eq("episode_id", episodeId);
  }

  const fromStatus = episode.status as PatientStatus;
  const durationSeconds = getCurrentPeriodSeconds(episode.status_started_at);
  const accumulated = accumulateStatusSeconds(fromStatus, {
    triagem_seconds: episode.triagem_seconds ?? 0,
    observacao_seconds: episode.observacao_seconds ?? 0,
    internado_seconds: episode.internado_seconds ?? 0,
    status_started_at: episode.status_started_at ?? episode.created_at,
  });

  const { data: updated, error: updateError } = await supabase
    .from("patient_episodes")
    .update({
      status: "alta_recente",
      updated_at: nowIso,
      status_started_at: nowIso,
      alta_days: altaDays,
      alta_started_at: nowIso,
      triagem_seconds: accumulated.triagem_seconds,
      observacao_seconds: accumulated.observacao_seconds,
      internado_seconds: accumulated.internado_seconds,
    })
    .eq("id", episodeId)
    .select("*, patient:patients (*)")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await releaseOrganizationBedForEpisode(supabase, adminId, episodeId);

  await supabase.from("patient_movements").insert({
    episode_id: episodeId,
    from_status: fromStatus,
    to_status: "alta_recente",
    report_text: report,
    risk_level: null,
    alta_days: altaDays,
    duration_seconds: durationSeconds,
    created_by: user!.id,
  });

  await appendTimelineEvent(supabase, {
    episode_id: episodeId,
    event_type: "alta_confirmada",
    summary_text: `Alta hospitalar confirmada (${altaDays} dias em alta recente)`,
    occurred_at: nowIso,
  });

  return NextResponse.json({ episode: updated });
}
