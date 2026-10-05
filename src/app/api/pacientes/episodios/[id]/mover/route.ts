import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import {
  occupyOrganizationBed,
  releaseOrganizationBedForEpisode,
} from "@/lib/inpatient/bed-sync";
import {
  chartNeedsAdmissionSeed,
  seedAdmissionFromKanbanReport,
  seedAdmissionFromProtocolTransfer,
} from "@/lib/inpatient/seed-admission-from-protocol";
import { refreshEpisodeRiskLevel } from "@/lib/inpatient/sync-episode-risk";
import type { ProtocolInternationTransfer } from "@/lib/inpatient/protocol-internation";
import { accumulateStatusSeconds, getCurrentPeriodSeconds } from "@/lib/patient-status-time";
import {
  ALLOWED_TRANSITIONS,
  type PatientStatus,
  type RiskLevel,
} from "@/lib/types/patient";
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId, user } = session;
  const { id: episodeId } = await context.params;

  let body: {
    to_status?: PatientStatus;
    report_text?: string;
    risk_level?: RiskLevel;
    alta_days?: number;
    weight?: string;
    bed?: string;
    allergies?: string;
    medications?: string;
    diagnosis?: string;
    initial_assessment?: string;
    organization_bed_id?: string;
    internation_seed?: Omit<ProtocolInternationTransfer, "createdAt">;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { to_status, report_text, risk_level, alta_days } = body;

  if (!to_status) {
    return NextResponse.json({ error: "Destino é obrigatório." }, { status: 400 });
  }

  if (!report_text?.trim() && to_status !== "triagem") {
    return NextResponse.json(
      { error: "Relatório é obrigatório para esta movimentação." },
      { status: 400 }
    );
  }

  const { data: episode } = await supabase
    .from("patient_episodes")
    .select("*, patient:patients (*)")
    .eq("id", episodeId)
    .single();

  if (!episode || episode.patient?.admin_id !== adminId) {
    return NextResponse.json({ error: "Episódio não encontrado." }, { status: 404 });
  }

  const fromStatus = episode.status as PatientStatus;
  const allowed = ALLOWED_TRANSITIONS[fromStatus] ?? [];

  if (!allowed.includes(to_status)) {
    return NextResponse.json(
      { error: `Não é possível mover de ${fromStatus} para ${to_status}.` },
      { status: 400 }
    );
  }

  if (to_status === "alta_recente" && (!alta_days || alta_days < 1)) {
    return NextResponse.json(
      { error: "Informe o período em dias para alta recente." },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();
  const durationSeconds = getCurrentPeriodSeconds(episode.status_started_at);
  const accumulated = accumulateStatusSeconds(fromStatus, {
    triagem_seconds: episode.triagem_seconds ?? 0,
    observacao_seconds: episode.observacao_seconds ?? 0,
    internado_seconds: episode.internado_seconds ?? 0,
    status_started_at: episode.status_started_at ?? episode.created_at,
  });

  const updateData: Record<string, unknown> = {
    status: to_status,
    updated_at: nowIso,
    status_started_at: nowIso,
    triagem_seconds: accumulated.triagem_seconds,
    observacao_seconds: accumulated.observacao_seconds,
    internado_seconds: accumulated.internado_seconds,
  };
  if (to_status === "internado" && risk_level) {
    updateData.risk_level = risk_level;
  }

  if (to_status === "alta_recente") {
    updateData.alta_days = alta_days;
    updateData.alta_started_at = nowIso;
  }
  if (to_status === "triagem" && fromStatus === "alta_recente") {
    updateData.alta_days = null;
    updateData.alta_started_at = null;
  }

  if (body.weight !== undefined) updateData.weight = body.weight?.trim() || null;
  if (body.bed !== undefined) updateData.bed = body.bed?.trim() || null;
  if (body.allergies !== undefined)
    updateData.allergies = body.allergies?.trim() || null;
  if (body.medications !== undefined)
    updateData.medications = body.medications?.trim() || null;
  if (body.diagnosis !== undefined)
    updateData.diagnosis = body.diagnosis?.trim() || null;
  if (body.initial_assessment !== undefined)
    updateData.initial_assessment = body.initial_assessment?.trim() || null;

  const { data: updated, error: updateError } = await supabase
    .from("patient_episodes")
    .update(updateData)
    .eq("id", episodeId)
    .select("*, patient:patients (*)")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (fromStatus === "internado" && to_status !== "internado") {
    await releaseOrganizationBedForEpisode(supabase, adminId, episodeId);
  }

  if (to_status === "internado" && body.organization_bed_id?.trim()) {
    const bedErr = await occupyOrganizationBed(
      supabase,
      adminId,
      body.organization_bed_id.trim(),
      episodeId,
    );
    if (bedErr) {
      return NextResponse.json({ error: bedErr }, { status: 400 });
    }
  }

  if (
    fromStatus === "em_observacao" &&
    to_status === "internado" &&
    report_text?.trim()
  ) {
    const promoHtml = `<p><strong>Promoção para internação formal</strong> — ${new Date().toLocaleString("pt-BR")}</p><p>${report_text.trim().replace(/</g, "&lt;")}</p>`;
    await supabase.from("episode_evolutions").insert({
      episode_id: episodeId,
      content_html: promoHtml,
      created_by: user!.id,
      signed_at: nowIso,
      signed_by: user!.id,
    });
  }

  if (to_status === "internado") {
    const patient = updated.patient as import("@/lib/types/patient").Patient;
    const ep = updated as import("@/lib/types/patient").PatientEpisode;
    if (body.internation_seed) {
      await seedAdmissionFromProtocolTransfer(
        supabase,
        ep,
        patient,
        body.internation_seed,
        user!.id,
      );
    } else if (
      report_text?.trim() &&
      (await chartNeedsAdmissionSeed(supabase, episodeId))
    ) {
      await seedAdmissionFromKanbanReport(
        supabase,
        ep,
        patient,
        report_text.trim(),
        user!.id,
      );
    }
  }

  if (to_status === "internado") {
    const patient = updated.patient as import("@/lib/types/patient").Patient;
    await refreshEpisodeRiskLevel(supabase, episodeId, {
      admissionAt: updated.created_at,
      birthDate: patient?.birth_date ?? null,
    });
    const { data: riskRefreshed } = await supabase
      .from("patient_episodes")
      .select("*, patient:patients (*)")
      .eq("id", episodeId)
      .single();
    if (riskRefreshed) {
      Object.assign(updated, riskRefreshed);
    }
  }

  await supabase.from("patient_movements").insert({
    episode_id: episodeId,
    from_status: fromStatus,
    to_status,
    report_text: report_text?.trim() ?? "",
    risk_level:
      to_status === "internado"
        ? (updated as { risk_level?: RiskLevel | null }).risk_level ?? risk_level ?? null
        : null,
    alta_days: to_status === "alta_recente" ? alta_days : null,
    duration_seconds:
      fromStatus === "triagem" ||
      fromStatus === "em_observacao" ||
      fromStatus === "internado"
        ? durationSeconds
        : null,
    created_by: user!.id,
  });
  return NextResponse.json({ episode: updated });
}
