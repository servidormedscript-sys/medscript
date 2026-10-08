import { NextResponse } from "next/server";
import { getSessionWithAdmin } from "@/lib/api/require-session";
import {
  computeStatusForEpisode,
  type EpisodeClinicalBundle,
} from "@/lib/inpatient/clinical-status-batch";
import { occupyOrganizationBed } from "@/lib/inpatient/bed-sync";
import { loadClinicalBundles } from "@/lib/inpatient/load-clinical-bundles";
import { fetchCareItemsByEpisode } from "@/lib/patient-care-fetch";
import type { KanbanEpisode, PatientSex, PatientStatus, RiskLevel } from "@/lib/types/patient";
import { seedAdmissionFromProtocolTransfer } from "@/lib/inpatient/seed-admission-from-protocol";
import { refreshEpisodeRiskLevel } from "@/lib/inpatient/sync-episode-risk";
import type { ProtocolInternationTransfer } from "@/lib/inpatient/protocol-internation";
import { computeCriticalLabConducts } from "@/lib/inpatient/lab-critical-conduct";
import { loadOrgClinicalRules } from "@/lib/clinical-rules/load-org-clinical-rules";
import { computeLabAlerts } from "@/lib/inpatient/lab-alerts";
import { computeDischargePrediction } from "@/lib/inpatient/discharge-prediction";
import { buildPatientNextSteps } from "@/lib/inpatient/patient-next-steps";
import { INITIAL_KANBAN_OPTIONS, STATUS_LABELS } from "@/lib/types/patient";

function computeDaysRemaining(
  altaStartedAt: string | null,
  altaDays: number | null
): number | null {
  if (!altaStartedAt || !altaDays) return null;

  const start = new Date(altaStartedAt);
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + altaDays);

  const diff = Math.ceil(
    (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, diff);
}

export async function GET() {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId } = session;
  const orgClinical = await loadOrgClinicalRules(supabase, adminId);

  await supabase.rpc("archive_expired_alta_patients");

  const { data, error } = await supabase
    .from("patient_episodes")
    .select(
      `
      *,
      patient:patients (*)
    `
    )
    .in("status", ["triagem", "em_observacao", "internado", "alta_recente"])
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const filtered = (data ?? []).filter((ep) => ep.patient?.admin_id === adminId);
  const episodeIds = filtered.map((ep) => ep.id);

  let summariesByEpisode: Record<string, NonNullable<KanbanEpisode["care_summary"]>> =
    {};

  try {
    const care = await fetchCareItemsByEpisode(supabase, episodeIds);
    summariesByEpisode = care.summariesByEpisode;
  } catch (careError) {
    const message =
      careError instanceof Error ? careError.message : "Erro ao carregar resumo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const trackableIds = filtered
    .filter((ep) => ep.status === "internado" || ep.status === "alta_recente")
    .map((ep) => ep.id);

  let clinicalBundles = new Map<string, EpisodeClinicalBundle>();
  try {
    clinicalBundles = await loadClinicalBundles(supabase, trackableIds);
  } catch {
    clinicalBundles = new Map();
  }

  const codeStatusByEpisode = new Map<string, string>();
  const codeUpdatedAtByEpisode = new Map<string, string>();
  const tevFilledByEpisode = new Map<string, boolean>();
  const pendingReconByEpisode = new Map<string, number>();
  const pendingLabsByEpisode = new Map<
    string,
    import("@/lib/types/inpatient-chart").EpisodeLabPending[]
  >();

  if (trackableIds.length > 0) {
    const [conductRes, ordersRes, reconRes, pendingRes] = await Promise.all([
      supabase
        .from("episode_conduct")
        .select("episode_id, code_status, code_updated_at")
        .in("episode_id", trackableIds),
      supabase
        .from("episode_general_orders")
        .select("episode_id, padua_score, caprini_score")
        .in("episode_id", trackableIds),
      supabase
        .from("episode_med_reconciliation")
        .select("episode_id")
        .in("episode_id", trackableIds)
        .eq("status", "pendente"),
      supabase
        .from("episode_lab_pending")
        .select("*")
        .in("episode_id", trackableIds)
        .is("fulfilled_at", null),
    ]);
    for (const row of conductRes.data ?? []) {
      codeStatusByEpisode.set(row.episode_id, row.code_status);
      if (row.code_updated_at) {
        codeUpdatedAtByEpisode.set(
          row.episode_id,
          String(row.code_updated_at),
        );
      }
    }
    for (const row of ordersRes.data ?? []) {
      const padua = (row.padua_score as Record<string, boolean>) ?? {};
      const caprini = (row.caprini_score as Record<string, boolean>) ?? {};
      tevFilledByEpisode.set(
        row.episode_id,
        Object.values(padua).some(Boolean) ||
          Object.values(caprini).some(Boolean),
      );
    }
    for (const row of reconRes.data ?? []) {
      pendingReconByEpisode.set(
        row.episode_id,
        (pendingReconByEpisode.get(row.episode_id) ?? 0) + 1,
      );
    }
    for (const row of pendingRes.data ?? []) {
      const eid = String(row.episode_id);
      const list = pendingLabsByEpisode.get(eid) ?? [];
      list.push(row as import("@/lib/types/inpatient-chart").EpisodeLabPending);
      pendingLabsByEpisode.set(eid, list);
    }
  }

  const episodes = filtered.map((ep) => {
    const base = {
      ...ep,
      days_remaining: computeDaysRemaining(ep.alta_started_at, ep.alta_days),
      care_summary: summariesByEpisode[ep.id] ?? {
        pendingExamCount: 0,
        pendingMedDoseCount: 0,
        pendingExams: [],
        pendingMedDoses: [],
      },
    };

    if (ep.status !== "internado" && ep.status !== "alta_recente") {
      return base;
    }

    const birthDate = ep.patient?.birth_date ?? null;
    const status = computeStatusForEpisode(
      ep.id,
      ep.created_at,
      birthDate,
      clinicalBundles,
    );

    const codeStatus = codeStatusByEpisode.get(ep.id);
    const bundle = clinicalBundles.get(ep.id) ?? {
      vitals: [],
      labs: [],
      evolutionAt: [],
    };
    const labAlerts = computeLabAlerts(bundle.labs);
    const criticalConducts = computeCriticalLabConducts(
      bundle.labs,
      orgClinical.labCriticalRules,
    );
    const internationHours =
      (Date.now() - new Date(ep.created_at).getTime()) / (1000 * 60 * 60);
    const codeUpdatedAt = codeUpdatedAtByEpisode.get(ep.id)
      ? new Date(codeUpdatedAtByEpisode.get(ep.id)!).getTime()
      : null;
    const codeReviewDue =
      status.risk === "alto" &&
      (!codeUpdatedAt ||
        (Date.now() - codeUpdatedAt) / (1000 * 60 * 60) > 48);

    const steps = buildPatientNextSteps({
      clinicalStatus: status,
      vitalRecords: bundle.vitals,
      labAlerts,
      criticalConducts,
      pendingReconciliation: pendingReconByEpisode.get(ep.id) ?? 0,
      pendingLabs: pendingLabsByEpisode.get(ep.id) ?? [],
      codeStatus: (codeStatus as import("@/lib/types/inpatient-chart").CodeStatus) ?? null,
      internationHours,
      paduaFilled: tevFilledByEpisode.get(ep.id) ?? false,
      codeReviewDue,
    });

    const prediction = computeDischargePrediction({
      clinicalStatus: status,
      labValues: bundle.labs,
      vitalRecords: bundle.vitals,
      diagnosis: ep.diagnosis ?? null,
      codeStatus: (codeStatus as import("@/lib/types/inpatient-chart").CodeStatus) ?? null,
      activeLabAlertCount: labAlerts.length,
    });

    return {
      ...base,
      clinical_status: {
        risk: status.risk,
        discharge_met: status.discharge.met,
        discharge_total: status.discharge.total,
        evolution_delay_hours: status.evolutionDelayHours,
        next_step_preview: steps[0]?.text ?? null,
        next_steps: steps.slice(0, 5).map((s) => ({
          id: s.id,
          priority: s.priority,
          text: s.text,
          tab: s.tab,
        })),
        discharge_prediction: prediction.suppressed
          ? {
              suppressed: true,
              min_days: 0,
              max_days: 0,
              suppressed_reason: prediction.suppressedReason,
            }
          : {
              suppressed: false,
              min_days: prediction.minDays,
              max_days: prediction.maxDays,
            },
      },
      ...(codeStatus ? { code_status: codeStatus } : {}),
    };
  }) as KanbanEpisode[];

  const grouped = {
    triagem: episodes.filter((e) => e.status === "triagem"),
    em_observacao: episodes.filter((e) => e.status === "em_observacao"),
    internado: episodes.filter((e) => e.status === "internado"),
    alta_recente: episodes.filter((e) => e.status === "alta_recente"),
  };

  return NextResponse.json({ kanban: grouped, episodes });
}

export async function POST(request: Request) {
  const session = await getSessionWithAdmin();
  if ("error" in session && session.error) return session.error;

  const { supabase, adminId, user } = session;

  let body: {
    full_name?: string;
    cpf?: string;
    birth_date?: string;
    sex?: PatientSex;
    weight?: string;
    bed?: string;
    diagnosis?: string;
    allergies?: string;
    medications?: string;
    initial_status?: PatientStatus;
    initial_assessment?: string;
    risk_level?: RiskLevel;
    alta_days?: number;
    care_specialty?: string;
    organization_bed_id?: string;
    internation_seed?: ProtocolInternationTransfer;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const fullName = body.full_name?.trim();
  const cpf = body.cpf?.replace(/\D/g, "");
  const birthDate = body.birth_date;
  const sex = body.sex;
  const initialStatus = body.initial_status ?? "triagem";

  if (!fullName || !cpf || cpf.length !== 11) {
    return NextResponse.json(
      { error: "Nome completo e CPF válido (11 dígitos) são obrigatórios." },
      { status: 400 }
    );
  }

  if (!birthDate) {
    return NextResponse.json(
      { error: "Data de nascimento é obrigatória." },
      { status: 400 }
    );
  }

  if (!sex || !["masculino", "feminino", "outro"].includes(sex)) {
    return NextResponse.json({ error: "Sexo é obrigatório." }, { status: 400 });
  }

  if (!INITIAL_KANBAN_OPTIONS.includes(initialStatus)) {
    return NextResponse.json(
      { error: "Situação inicial inválida para cadastro." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("patients")
    .select("id, is_archived")
    .eq("admin_id", adminId)
    .eq("cpf", cpf)
    .maybeSingle();

  if (existing && !existing.is_archived) {
    return NextResponse.json(
      { error: "Já existe um paciente ativo com este CPF." },
      { status: 400 }
    );
  }

  if (existing?.is_archived) {
    return NextResponse.json(
      {
        error:
          "Paciente arquivado encontrado. Use a aba Desarquivamento para reativar.",
        patient_id: existing.id,
      },
      { status: 409 }
    );
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert({
      admin_id: adminId,
      full_name: fullName,
      cpf,
      birth_date: birthDate,
      sex,
      is_archived: false,
    })
    .select("*")
    .single();

  if (patientError || !patient) {
    return NextResponse.json(
      { error: patientError?.message ?? "Erro ao cadastrar paciente." },
      { status: 500 }
    );
  }

  const episodeData: Record<string, unknown> = {
    patient_id: patient.id,
    episode_number: 1,
    status: initialStatus,
    status_started_at: new Date().toISOString(),
    triagem_seconds: 0,
    observacao_seconds: 0,
    internado_seconds: 0,
    weight: body.weight?.trim() || null,    bed: body.bed?.trim() || null,
    diagnosis: body.diagnosis?.trim() || null,
    allergies: body.allergies?.trim() || null,
    medications: body.medications?.trim() || null,
    initial_assessment: body.initial_assessment?.trim() || null,
    care_specialty: body.care_specialty?.trim() || null,
    created_by: user!.id,
  };

  if (initialStatus === "internado" && body.risk_level) {
    episodeData.risk_level = body.risk_level;
  }

  const { data: episode, error: episodeError } = await supabase
    .from("patient_episodes")
    .insert(episodeData)
    .select("*, patient:patients (*)")
    .single();

  if (episodeError) {
    return NextResponse.json({ error: episodeError.message }, { status: 500 });
  }

  const reportParts = [
    `Paciente cadastrado em ${STATUS_LABELS[initialStatus]}.`,
    body.diagnosis?.trim() ? `Diagnóstico: ${body.diagnosis.trim()}` : null,
    body.initial_assessment?.trim()
      ? `Avaliação T0: ${body.initial_assessment.trim()}`
      : null,
  ].filter(Boolean);

  await supabase.from("patient_movements").insert({
    episode_id: episode.id,
    from_status: null,
    to_status: initialStatus,
    report_text: reportParts.join("\n\n"),
    risk_level: initialStatus === "internado" ? body.risk_level : null,
    created_by: user!.id,
  });

  if (
    initialStatus === "internado" &&
    body.organization_bed_id?.trim()
  ) {
    const bedErr = await occupyOrganizationBed(
      supabase,
      adminId,
      body.organization_bed_id.trim(),
      episode.id,
    );
    if (bedErr) {
      return NextResponse.json({ error: bedErr }, { status: 400 });
    }
    const { data: refreshed } = await supabase
      .from("patient_episodes")
      .select("*, patient:patients (*)")
      .eq("id", episode.id)
      .single();
    if (body.internation_seed && initialStatus === "internado") {
      await seedAdmissionFromProtocolTransfer(
        supabase,
        (refreshed ?? episode) as import("@/lib/types/patient").PatientEpisode,
        patient,
        body.internation_seed,
        user!.id,
      );
      await refreshEpisodeRiskLevel(supabase, episode.id, {
        admissionAt: episode.created_at,
        birthDate: patient.birth_date,
      });
    }
    return NextResponse.json(
      { patient, episode: refreshed ?? episode },
      { status: 201 },
    );
  }

  if (body.internation_seed && initialStatus === "internado") {
    await seedAdmissionFromProtocolTransfer(
      supabase,
      episode as import("@/lib/types/patient").PatientEpisode,
      patient,
      body.internation_seed,
      user!.id,
    );
    await refreshEpisodeRiskLevel(supabase, episode.id, {
      admissionAt: episode.created_at,
      birthDate: patient.birth_date,
    });
  }

  return NextResponse.json({ patient, episode }, { status: 201 });
}
